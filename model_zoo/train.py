import os
import torch
import argparse

import schedulefree
from models import load_model  # updated import
from torch.utils.data import DataLoader
import torch.optim as optim

from data.dataloader import load_dataset_instance
from train_utils.misc_tools import set_random_seed, create_directory_if_not_exists, count_param_numbers, save_checkpoint
from configs.config import get_cfg
from loss import get_loss_function


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data_path", type=str, required=True)
    parser.add_argument('--config', type=str, default='classification')
    parser.add_argument("--root_dir", type=str, default=os.getcwd())
    parser.add_argument("--num_epochs", type=int, default=50)
    parser.add_argument('--batch_size', type=int, default=1)
    parser.add_argument('--deployment_id', type=str, default=None)
    parser.add_argument('--use_wandb', type=int, default=-1)
    parser.add_argument('--inference_mode', type=int, default=-1)

    args = parser.parse_args()
    print(args, end='\n\n')
    config = get_cfg(
        config_file=os.path.join(args.root_dir, 'configs', 'yamls', args.config),
        root_dir=args.root_dir,
        num_epochs=args.num_epochs,
        batch_size=args.batch_size,
        model_uuid=args.deployment_id,
        use_wandb=True if args.use_wandb > 0 else False,
        checkpoint_name=os.path.join(
            "${ROOT_DIR}", 'checkpoints', 'lora_weights', args.deployment_id,),
        dataset_path=args.data_path,
        inference_mode=True if args.inference_mode > 0 else False,
    )
    print(f'[INFO] Config file: {config}')
    return config


def train(config):
    print(f"Running training...")
    train_dataset_class = load_dataset_instance(config.MODEL_NAME, os.path.join(config.DATASET.DATASET_PATH, 'train'))
    val_dataset_class = load_dataset_instance(config.MODEL_NAME, os.path.join(config.DATASET.DATASET_PATH, 'val'))

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    num_workers = 0
    common_loader_params = {
        'num_workers': num_workers,
        'pin_memory': True,
        'persistent_workers': False,
    }
    
    train_loader = DataLoader(
        train_dataset_class, batch_size=config.BATCH_SIZE, shuffle=True, **common_loader_params)
    val_loader = DataLoader(val_dataset_class, batch_size=1,
                            shuffle=False, **common_loader_params)

    num_classes = None
    class_to_idx = None
    if config.MODEL_NAME == 'classification':
        num_classes = train_dataset_class.get_num_classes()
        class_to_idx = train_dataset_class.class_to_idx
        print('[INFO] Number of classes in dataset:', num_classes)
        config.defrost()
        config.MODEL.NUM_CLASSES = num_classes
        config.freeze()


    model = load_model(config, inference_mode=False)
    model.to(device)

    print(f'[INFO] Number of batches in train_set: {len(train_loader)}')
    print(f'[INFO] Number of batches in val_set: {len(val_loader)}')
    print('[INFO] Model loaded successfully:', model)
    for name, param in model.named_parameters():
        print(
            f'[PARAM] {name} | Requires Grad: {param.requires_grad} | Shape: {param.shape}')

    n_params = count_param_numbers(model)
    print(f"[INFO] Number of parameters: {n_params:,}")

    print('[INFO] AdamW Scheduler Free was chosen for the optimizer')
    param_groups = [
        {
            'params': [p for n, p in model.named_parameters()
                    if 'lora' in n and p.requires_grad],
            'lr': config.LR.LORA
        },
        {
            'params': [p for n, p in model.named_parameters()
                    if 'lora' not in n and p.requires_grad],
            'lr': config.LR.BASE
        }
    ]
    optimizer = schedulefree.AdamWScheduleFree(
        param_groups, weight_decay=config.WEIGHT_DECAY)

    train_loss_fn = get_loss_function(config.MODEL_NAME)
    val_loss_fn = get_loss_function(config.MODEL_NAME)

    # Save checkpoints & wandb setup
    checkpoint_dir = os.path.join(config.CHECKPOINT_NAME)
    create_directory_if_not_exists(checkpoint_dir)
    checkpoint_path = os.path.join(checkpoint_dir, 'best_model.pth.tr')

    best_val_loss = float('inf')
    for epoch in range(config.START_EPOCH, config.EPOCH_NUMBER):
        print(f"[INFO] Epoch {epoch}")
        model.eval()
        optimizer.eval()
        with torch.no_grad():
            val_loss = 0
            for i, batch in enumerate(val_loader):
                inputs, targets = batch
                inputs, targets = inputs.to(device), targets.to(device)

                outputs = model(x=inputs)
                loss = val_loss_fn(outputs, targets)
                val_loss += loss.item()

            val_loss /= len(val_loader)
            print(f"[VAL] Loss: {val_loss:.6f}")

        if val_loss < best_val_loss:
            best_val_loss = val_loss
            save_checkpoint(model, checkpoint_path, num_classes, class_to_idx)
            print(f"[INFO] Checkpoint saved: {checkpoint_path}")

        model.train()
        optimizer.train()
        total_loss = 0
        for i, batch in enumerate(train_loader):
            inputs, targets = batch
            inputs, targets = inputs.to(device), targets.to(device)

            outputs = model(x=inputs)
            loss = train_loss_fn(outputs, targets)

            optimizer.zero_grad()
            loss.backward()
            torch.nn.utils.clip_grad_norm_(
                model.parameters(), max_norm=config.MAX_GRAD_NORM)
            optimizer.step()
            total_loss += loss.item()

        loss = total_loss / len(train_loader)
        print(f"[TRAIN] Loss: {loss:.6f}")

        print("pipe:{\"epoch\":"+str(epoch)+",\"train_loss\":"+str(loss)+",\"val_loss\":"+str(val_loss)+"}")

def inference(config):
    print('Running inference...')
    dataset_class = load_dataset_instance(config.MODEL_NAME, config.DATASET.DATASET_PATH, inference=True)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    
    checkpoint_path = os.path.join(config.CHECKPOINT_NAME, 'best_model.pth.tr')
    if os.path.exists(checkpoint_path):
        print(f"[INFO] Loading checkpoint from {checkpoint_path}")
        checkpoint = torch.load(checkpoint_path, map_location=device)
    else:
        checkpoint = None
        print(f"[ERROR] Checkpoint not found: {checkpoint_path}")
        return
        
    if config.MODEL_NAME == 'classification':
        try:
            num_classes = checkpoint['num_classes']
            class_to_idx = checkpoint['class_to_idx']
        except KeyError:
            print("[ERROR] 'num_classes' not found in checkpoint. Using dataset class count.")
        
        config.defrost()
        config.MODEL.NUM_CLASSES = num_classes
        config.freeze()
    
    inference_loader = DataLoader(
        dataset_class, batch_size=1, shuffle=False,)

    model = load_model(config, inference_mode=True)
    model.to(device)
    model.eval()
    
    for i, batch in enumerate(inference_loader):
        inputs, model_paths = batch
        inputs = inputs.to(device)

        with torch.no_grad():
            outputs = model(x=inputs)

            if config.MODEL_NAME == 'classification':
                outputs = torch.argmax(outputs, dim=1)
                for output, i in class_to_idx.items():
                    if i == outputs.item():
                        text_output = output
                        break
                print(f"[INFO] Textual model class: {text_output}")
            print(f"[INFO] Inference {i+1}/{len(inference_loader)}: {model_paths[0]}")
            print(f"[INFO] Model output: {outputs}")

    print("[INFO] Inference completed.")


def main():
    config = parse_args()
    set_random_seed(config.SEED)
    if config.EVAL_ONLY:
        inference(config)
    else:
        train(config)

if __name__ == '__main__':
    main()
