import os
import torch
import wandb
import argparse
import uuid

from torch.utils.data import DataLoader
import torch.optim as optim
import schedulefree
from train_utils.misc_tools import set_random_seed, create_directory_if_not_exists, count_param_numbers, save_checkpoint
from models import load_model  # updated import

from configs.config import get_cfg


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data_path", type=str, required=True)
    parser.add_argument('--config', type=str, default='classification')
    parser.add_argument("--root_dir", type=str, default=os.getcwd())
    parser.add_argument("--num_epochs", type=int, default=50)
    parser.add_argument('--batch_size', type=int, default=1)
    parser.add_argument('--deployment_id', type=str, default=None)
    parser.add_argument('--use_wandb', type=int, default=-1)

    args = parser.parse_args()
    print(args, end='\n\n')
    config = get_cfg(
        config_file=args.config,
        root_dir=args.root_dir,
        num_epochs=args.num_epochs,
        batch_size=args.batch_size,
        model_uuid=args.deployment_id,
        use_wandb=True if args.use_wandb > 0 else False,
        checkpoint_name=os.path.join("${ROOT_DIR}", 'checkpoints', 'lora_weights', args.deployment_id,),
        dataset_path=os.path.join("${ROOT_DIR}", 'data', 'datasets', args.deployment_id,),
    )
    print(f'[INFO] Config file: {config}')
    return config

def train(config):
    dataset_kwargs = dict(
        config=config,
        dataset_path=config.DATASET.DATA_PATH, 
        num_frames=config.DATASET.NUM_FRAMES, 
        load_full_data=config.DATASET.LOAD_FULL_DATA
    )
    train_dataset = JHMDBLoad(split='train', **dataset_kwargs)
    val_dataset = JHMDBLoad(split='val', **dataset_kwargs)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    num_workers = 0
    common_loader_params = {
        'num_workers': num_workers,
        'pin_memory': True,
        'persistent_workers': False,
    }

    train_loader = DataLoader(train_dataset, batch_size=config.BATCH_SIZE, shuffle=True, **common_loader_params)
    val_loader = DataLoader(val_dataset, batch_size=1, shuffle=False, **common_loader_params)

    model = load_model(config.MODEL_NAME, inference_mode=False)
    model.to(device)

    print(f'[INFO] Number of batches in train_set: {len(train_loader)}')
    print(f'[INFO] Number of batches in val_set: {len(val_loader)}')
    print('[INFO] Model loaded successfully:', model)
    for name, param in model.named_parameters():
        print(f'[PARAM] {name} | Requires Grad: {param.requires_grad} | Shape: {param.shape}')

    n_params = count_param_numbers(model)
    print(f"[INFO] Number of parameters: {n_params:,}")

    optimizer = torch.optim.AdamW(
        filter(lambda p: p.requires_grad, model.parameters()),
        lr=config.LR.BASE,
        weight_decay=config.WEIGHT_DECAY
    )
    scheduler = None

    train_loss_fn = HeatmapPoseLoss(config.DATASET.JOINT_NUMBER, config.IMAGE.HEATMAP_HEIGHT, config.IMAGE.HEATMAP_WIDTH, config.LOSSES, num_frames=config.DATASET.NUM_FRAMES)
    val_loss_fn = KeypointLoss(config)

    # Save checkpoints & wandb setup
    checkpoint_dir = os.path.join(config.CHECKPOINT_DIRECTORY, config.CHECKPOINT_NAME)
    create_directory_if_not_exists(checkpoint_dir)
    checkpoint_path_latest = os.path.join(checkpoint_dir, 'latest_epoch.pth.tr')

    wandb_id = config.WANDB_ID if config.WANDB_ID != -1 else str(uuid.uuid4())

    if config.USE_WANDB:
        os.environ["WANDB__SERVICE_WAIT"] = "3000"
        wandb.init(id=wandb_id, project=config.MODEL_NAME, name=config.CHECKPOINT_NAME)

    best_val_loss = float('inf')
    for epoch in range(config.START_EPOCH, config.EPOCH_NUMBER):
        print(f"[INFO] Epoch {epoch}")
        model.train()
        total_loss = 0
        for i, batch in enumerate(train_loader):
            batch_dct = process_jhmdb_inputs(batch, config, True, i, 'train')
            inputs = batch_dct['video'].to(device)
            heatmaps = batch_dct['heatmaps'].to(device)
            mask = batch_dct['mask'].to(device)

            outputs = model(inputs)
            outputs = process_jhmdb_outputs(outputs, config, True, i, 'train')
            loss = train_loss_fn(outputs.float(), heatmaps, mask=mask)

            optimizer.zero_grad()
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=config.MAX_GRAD_NORM)
            optimizer.step()
            total_loss += loss.item()

        print(f"[TRAIN] Loss: {total_loss / len(train_loader):.6f}")

        model.eval()
        with torch.no_grad():
            val_loss = 0
            for i, batch in enumerate(val_loader):
                batch_dct = process_jhmdb_inputs(batch, config, True, i, 'val')
                inputs = batch_dct['video'].to(device)
                joints = batch_dct['joints_normalized'].to(device)
                mask = batch_dct['mask'].to(device)
                outputs = model(inputs)
                outputs, _, _ = process_jhmdb_outputs(outputs, config, True, i, 'val')
                val_loss += val_loss_fn(outputs.float(), joints.float(), visibility=mask)[0].item()

            val_loss /= len(val_loader)
            print(f"[VAL] Loss: {val_loss:.6f}")

        if val_loss < best_val_loss:
            best_val_loss = val_loss
            save_checkpoint(epoch, model, [g['lr'] for g in optimizer.param_groups], optimizer, val_loss, wandb_id, checkpoint_path_latest)
            print(f"[INFO] Checkpoint saved: {checkpoint_path_latest}")

        if config.USE_WANDB:
            wandb.log({"epoch": epoch, "train_loss": total_loss / len(train_loader), "val_loss": val_loss})

    if config.USE_WANDB:
        wandb.finish()

def main():
    config = parse_args()
    set_random_seed(config.SEED)
    train(config)

if __name__ == '__main__':
    main()
