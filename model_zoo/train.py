import os
import torch
import wandb
import argparse
import uuid

from torch.utils.data import DataLoader
import torch.optim as optim
import schedulefree
from train_utils.misc_tools import set_random_seed, create_directory_if_not_exists, count_param_numbers, save_checkpoint
from train_utils.load_models import load_model
from datasets.datasets2d.jhmdb_utils.jhmdb_utils import process_jhmdb_inputs, process_jhmdb_outputs

from benchmark.eval_metrics import calculate_heatmap_pck, calculate_jhmdb_PCK
from configs.config import get_cfg

# losses
from loss.jhmdb_loss import HeatmapPoseLoss, KeypointLoss

# dataset
from datasets.datasets2d.loadJHMDB import JHMDBLoad

def parse_args():
    '''
    Parse arguments passed with training file, and returns the corresponding config file in the format of a dictionary
    '''
    parser = argparse.ArgumentParser()
    parser.add_argument("--data_path", type=str, required=True)
    parser.add_argument('--config', type=str, default='classification',
                        help='Name of the configuration file')
    parser.add_argument("--root_dir", type=str, default=os.getcwd(),
                        help="Root directory of the project")
    parser.add_argument("--num_epochs", type=int, default=50,
                        help="Number of Epochs to Train")
    parser.add_argument('--batch_size', type=int, default=1,)
    parser.add_arugment('deployment_id', type=str, default=None,
                        help='UUID of the model to train')
    parser.add_argument('--use_wandb', type=int, default=-1,
                        help='Whether to use Weights and Biases for logging')

    args = parser.parse_args()
    print(args, end='\n\n')
    config = get_cfg(
        config_file = args.config,
        root_dir = args.root_dir,
        num_epochs = args.num_epochs,
        batch_size = args.batch_size,
        model_uuid = args.deployment_id,
        use_wandb = True if args.use_wandb > 0 else False,
        checkpoint_name=os.path.join("${ROOT_DIR}", 'checkpoints', 'lora_weights', args.model_uuid,),
        dataset_path=os.path.join("${ROOT_DIR}", 'data', 'datasets', args.model_uuid,),
    )
    print(f'[INFO] Config file: {config}')
    return config


def train_one_epoch(is_first_epoch, config, model, train_loader, optimizer, device, loss_fn):
    '''Train one epoch
    Args:
        start_epoch (bool): whether the current epoch is the first
        config (dict): configuration dictionary
        model (nn.Module)
        train_loader (DataLoader): dataset
        optimizer (optim.Adam or optim.AdamW)
        scheduler (optim.lr_scheduler)
        device (str)
        loss_fn (nn.Module)

    Returns:
        Tuple[float, float]: [train loss per batch, total train loss]
    '''
    if is_first_epoch:
        print(f'[INFO] len(train_loader) [per rank]: {len(train_loader)}')

    if config.OPTIMIZER == 'schedulefree':
        optimizer.train()

    model.train()
    local_sum_loss = 0.0
    local_batch_count = 0

    for i, batch in enumerate(train_loader):
        batch_dct = process_jhmdb_inputs(
            batch, 
            config, 
            is_first_epoch, 
            batch_idx=i, 
            split='train'
        )
        
        train_inputs = batch_dct['video'].to(device)
        heatmaps = batch_dct['heatmaps'].to(device)
        mask = batch_dct['mask'].to(device)
        
        train_outputs = model(train_inputs)
        
        train_outputs = process_jhmdb_outputs(
            train_outputs, 
            config, 
            is_first_epoch, 
            batch_idx=i,
            split='train'
        )

        train_outputs = train_outputs.float().to(device)

        loss = loss_fn(
            train_outputs,
            heatmaps, 
            mask=mask
        )

        optimizer.zero_grad()
        loss.backward()

        # Gradient clipping
        if config.MAX_GRAD_NORM > 0:
            torch.nn.utils.clip_grad_norm_(
                model.parameters(), max_norm=config.MAX_GRAD_NORM)

        optimizer.step()

        local_sum_loss += loss.item()
        local_batch_count += 1
    
    # Compute the *global* sum of losses and total batch count across all ranks:
    # We pack them into a single Tensor of shape (2,), then do all_reduce(SUM).
    # [ global_sum_loss, global_batch_count ] will live in that tensor afterward.
    if config.DISTRIBUTED and dist.is_initialized():
        # Create a float tensor on the correct device
        stats_tensor = torch.tensor(
            [local_sum_loss, local_batch_count],
            device=device,
            dtype=torch.float32
        )
        dist.all_reduce(stats_tensor, op=dist.ReduceOp.SUM)
        global_sum_loss = stats_tensor[0].item()
        global_batch_count = stats_tensor[1].item()
    else:
        # Single‐GPU / CPU: “global” = “local”
        global_sum_loss = local_sum_loss
        global_batch_count = local_batch_count

    # Compute the true average loss over ALL batches on ALL ranks:
    global_avg_loss = global_sum_loss / (global_batch_count + 1e-12)

    if ddp_setup.is_main_process():
        print(f'[INFO] Global avg. training heatmap loss: {global_avg_loss:.6f}')
        print(f'[INFO] Global total training heatmap loss: {global_sum_loss:.6f}')
    return global_avg_loss, global_sum_loss


def evaluate(is_first_epoch, config, model, val_loader, device, loss_fn, optimizer):
    '''Evaluation run for the model

    Args:
        is_first_epoch (bool): whether the current epoch is the first
        config (dict): configuration dictionary
        model (nn.Module)
        val_loader (DataLoader)
        device (str)
        optimizer (torch.optim): optimizer function (only useful if schedule free)

    Returns:
        Tuple[float, float]: [validation loss per batch, total validation loss]
    '''
    if ddp_setup.is_main_process():
        print("[INFO] Evaluation")
        if is_first_epoch:
            print(f'[INFO] len(val_loader) [per rank]: {len(val_loader)}')

    model.eval()
    if config.OPTIMIZER == 'schedulefree':
        optimizer.eval()

    local_sum_val_loss = 0.0
    local_batch_count = 0

    # Initialize local sums for each threshold
    thresholds = [0.05, 0.1, 0.2]
    local_sum_pck_mmpose = {thr: 0.0 for thr in thresholds}
    local_sum_pck_deciwatch = {thr: 0.0 for thr in thresholds}


    with torch.no_grad():
        for i, batch in enumerate(val_loader):
            batch_dct = process_jhmdb_inputs(batch, config, is_first_epoch, batch_idx=i, split='val')
            
            val_inputs = batch_dct['video'].to(device)
            img_metas= batch_dct['img_metas']
            joints = batch_dct['joints_normalized'].to(device)
            mask = batch_dct['mask'].to(device)
            heatmaps = batch_dct['heatmaps'].to(device)
            bbox_xywh = batch_dct['bbox_xywh'].to(device)
            joints_raw = batch_dct['joints_raw'].to(device)
            bbox_x1y1x2y2 = batch_dct['bbox_x1y1x2y2'].to(device)
            imgshape = batch_dct['imgshape'].to(device)

            full_outputs = model(val_inputs, img_metas, return_heatmap=True)
            norm_outputs, heatmap_outputs, pred_keypoints = process_jhmdb_outputs(
                full_outputs, 
                config, 
                is_first_epoch, 
                batch_idx=i, 
                split='val', 
                bbox_xywh=bbox_xywh
            )

            pred_keypoints = pred_keypoints.to(device)
            heatmap_outputs = heatmap_outputs.to(device)
            norm_outputs = norm_outputs.to(device)

            ## Visualize the outputs ##
            # from visualization_utils.visualize_JHMDB import visualize
            
            # joints_affine = batch_dct['joints_affine'].to(device)
            # original_video = batch_dct['original_video'].to(device)
            
            # visualize(joints_affine[0], val_inputs[0].clone(), 'outputs/infinipose/jhmdb_new', 'gt_video_new_load', 192, 256)
            # visualize(joints_raw[0], original_video[0].clone(), 'outputs/infinipose/jhmdb_new', 'gt_video_new_load_1', 320, 240, bboxes=bbox_xywh[0])
            # visualize(pred_keypoints[0], val_inputs[0].clone(), 'outputs/infinipose/jhmdb_new', 'pred_video_new_load_0', 192, 256, bboxes=bbox_xywh[0])
            # visualize(pred_keypoints[0], original_video[0].clone(), 'outputs/infinipose/jhmdb_new', 'pred_video_new_load_1', 320, 240, bboxes=bbox_xywh[0])
            ## Visualize the final outputs ##

            loss, _ = loss_fn(
                norm_outputs.float(),
                joints.float(), 
                visibility=mask
            )
            local_sum_val_loss += loss.item()
            local_batch_count += 1

            # Accumulate local PCK sums for each threshold:
            for thr in thresholds:
                # 1) MMPOSE heatmap‐based PCK
                local_sum_pck_mmpose[thr] += calculate_heatmap_pck(
                    heatmap_outputs, heatmaps, mask, thr=thr
                )
                # 2) Deciwatch PCK (pointwise on keypoints)
                per_joint_pck = calculate_jhmdb_PCK(
                    predicted=pred_keypoints[0],
                    gt=joints_raw[0],
                    bbox=bbox_x1y1x2y2[0],
                    imgshape=imgshape[0],
                    thresh=thr,
                    mask=mask[0],
                )
                local_sum_pck_deciwatch[thr] += sum(per_joint_pck) / len(per_joint_pck)

    # Now we need to all‐reduce these local sums across ranks.
    if config.DISTRIBUTED and dist.is_initialized():
        # 1) Pack [local_sum_val_loss, local_batch_count] into a tensor:
        loss_count_tensor = torch.tensor(
            [local_sum_val_loss, local_batch_count],
            device=device,
            dtype=torch.float32
        )
        dist.all_reduce(loss_count_tensor, op=dist.ReduceOp.SUM)
        global_sum_val_loss = loss_count_tensor[0].item()
        global_batch_count  = loss_count_tensor[1].item()

        # 2) Pack all thresholds' PCK sums into a single tensor of shape (2×len(thresholds),):
        #    first half is mmpose sums, second half is deciwatch sums
        pck_values = []
        for thr in thresholds:
            pck_values.append(local_sum_pck_mmpose[thr])
        for thr in thresholds:
            pck_values.append(local_sum_pck_deciwatch[thr])

        pck_tensor = torch.tensor(pck_values, device=device, dtype=torch.float32)
        dist.all_reduce(pck_tensor, op=dist.ReduceOp.SUM)

        # Unpack the reduced PCK sums
        global_sum_pck_mmpose = {
            thresholds[i]: pck_tensor[i].item() for i in range(len(thresholds))
        }
        global_sum_pck_deciwatch = {
            thresholds[i]: pck_tensor[i + len(thresholds)].item() for i in range(len(thresholds))
        }
    else:
        # Single‐GPU / CPU
        global_sum_val_loss = local_sum_val_loss
        global_batch_count  = local_batch_count
        global_sum_pck_mmpose = local_sum_pck_mmpose
        global_sum_pck_deciwatch = local_sum_pck_deciwatch

    # Compute global averages
    global_avg_val_loss = global_sum_val_loss / (global_batch_count + 1e-12)

    avg_deciwatch = {thr: global_sum_pck_deciwatch[thr] / global_batch_count for thr in thresholds}
    avg_mmpose = {thr: global_sum_pck_mmpose[thr] / global_batch_count for thr in thresholds}
    
    # Only rank 0 prints the final metrics
    if ddp_setup.is_main_process():
        for thr in thresholds:
            print(f'[METRIC] Global MMPOSE Heatmap PCK ({thr}): {avg_mmpose[thr]:.4f}')
        
        for thr in thresholds:
            print(f'[METRIC] Global Deciwatch PCK ({thr}): {avg_deciwatch[thr]:.4f}')

        print(f'[METRIC] Global avg. validation loss: {global_avg_val_loss:.6f}')
        print(f'[METRIC] Global total validation loss: {global_sum_val_loss:.6f}\n')

    return global_avg_val_loss, global_sum_val_loss, avg_deciwatch


def train(config):
    '''Train the model

    Args:
        config (dict): configuration dictionary
    '''
    if config.DATASET.DATASET_NAME == 'JHMDB':
        dataset_kwargs = dict(
            config=config,
            dataset_path=config.DATASET.DATA_PATH, 
            num_frames=config.DATASET.NUM_FRAMES, 
            load_full_data=config.DATASET.LOAD_FULL_DATA
        )
        train_dataset = JHMDBLoad(split='train', **dataset_kwargs)
        val_dataset = JHMDBLoad(split='val', **dataset_kwargs)
    
    else:
        raise NotImplementedError(f"[ERROR] Dataset {config.DATASET.DATASET_NAME} not implemented!")

    # If distributed, pin to the correct GPU and create samplers
    if config.DISTRIBUTED:
        torch.cuda.set_device(config.GPU)
        device = torch.device(f"cuda:{config.GPU}")
        train_sampler = DistributedSampler(
            train_dataset,
            num_replicas=config.WORLD_SIZE,
            rank=config.RANK,
            shuffle=True
        )
        val_sampler = DistributedSampler(
            val_dataset,
            num_replicas=config.WORLD_SIZE,
            rank=config.RANK,
            shuffle=False
        )
    else:
        # single‐GPU or CPU
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        train_sampler = None
        val_sampler = None


    num_cpu_cores = os.cpu_count()
    num_workers = 0  # TODO CHECK LATER, is that crashing on narval?
    common_loader_params = {
        'num_workers': num_workers,
        'pin_memory': True,
        'persistent_workers': num_workers > 0,
    }
    print(
        f'[INFO] num_workers: {num_workers} && num_cpu_cores: {num_cpu_cores} cores')

    # Create DataLoaders (use sampler=DistributedSampler if distributed)
    if config.DISTRIBUTED:
        train_loader = DataLoader(
            train_dataset,
            batch_size=config.BATCH_SIZE,
            sampler=train_sampler,
            **common_loader_params
        )
        val_loader = DataLoader(
            val_dataset,
            batch_size=1,
            sampler=val_sampler,
            **common_loader_params
        )
    else:
        train_loader = DataLoader(
            train_dataset,
            batch_size=config.BATCH_SIZE,
            shuffle=True,
            **common_loader_params
        )
        val_loader = DataLoader(
            val_dataset,
            batch_size=1,
            shuffle=False,
            **common_loader_params
        )


    model = load_model(config)
    model.to(device)    

    # Wrap in DDP if needed
    model_without_ddp = model
    if config.DISTRIBUTED:
        model = DDP(model, device_ids=[config.GPU], output_device=config.GPU)
        model_without_ddp = model.module

    if ddp_setup.is_main_process():
        print(f'[INFO] Number of batches in train_set: {len(train_loader)}')
        print(f'[INFO] Number of batches in val_set: {len(val_loader)}')
        print('[INFO] Model loaded successfully as follows:', model_without_ddp)

        for name, param in model_without_ddp.named_parameters():
            print(
                f'[EXTRA] Parameter: {name} \t Requires Grad: {param.requires_grad} \t Shape: {param.shape}')

        n_params = count_param_numbers(model_without_ddp)
        print(f"[INFO] Number of parameters: {n_params:,}")

    param_groups = [
        {'params': [p for n, p in model_without_ddp.named_parameters(
        ) if 'betas' in n and p.requires_grad], 'lr': config.LR.BETA, 'initial_lr': config.LR.BETA},
        {'params': [p for n, p in model_without_ddp.named_parameters(
        ) if 'memory_encoder' in n and p.requires_grad], 'lr': config.LR.MEMORY_ENCODER, 'initial_lr': config.LR.MEMORY_ENCODER},
        {'params': [p for n, p in model_without_ddp.named_parameters(
        ) if 'betas' not in n and 'memory_encoder' not in n and p.requires_grad], 'lr': config.LR.BASE, 'initial_lr': config.LR.BASE},
    ]

    # Optimizer selection
    if config.OPTIMIZER == 'adam':
        print('[INFO] Using Adam optimizer.')
        optimizer = torch.optim.Adam(
            filter(lambda p: p.requires_grad, model_without_ddp.parameters()),
            lr=config.LR.BASE
        )
        scheduler = None
    elif config.OPTIMIZER == 'adamW':
        print('[INFO] Using AdamW optimizer.')
        optimizer = torch.optim.AdamW(param_groups, weight_decay=config.WEIGHT_DECAY)
        scheduler = None
    elif config.OPTIMIZER == 'schedulefree':
        print('[INFO] Using ScheduleFree AdamW optimizer.')
        optimizer = schedulefree.AdamWScheduleFree(param_groups, weight_decay=config.WEIGHT_DECAY)
        scheduler = None
    else:
        raise NotImplementedError(f"[ERROR] Optimizer {config.OPTIMIZER} not implemented.")

    # Scheduler (only if specified and not schedulefree)
    if config.SCHEDULER and config.OPTIMIZER != 'schedulefree':
        if config.SCHEDULER_FCT == 'RRLP':
            print("[INFO] Using ReduceLROnPlateau scheduler.")
            scheduler = optim.lr_scheduler.ReduceLROnPlateau(
                optimizer=optimizer,
                factor=config.SCHEDULER_FACTOR,
                patience=config.PATIENCE
            )
        elif config.SCHEDULER_FCT == 'cosine':
            print("[INFO] Using CosineAnnealingWarmRestarts scheduler.")
            scheduler = optim.lr_scheduler.CosineAnnealingWarmRestarts(
                optimizer=optimizer,
                T_0=config.T_0,
                T_mult=config.T_MULT,
                eta_min=config.ETA_MIN,
                last_epoch=config.START_EPOCH - 1
            )
        else:
            print("[INFO] No scheduler selected despite config.SCHEDULER == True.")
    else:
        scheduler = None

    train_loss_fn = HeatmapPoseLoss(
        config.DATASET.JOINT_NUMBER, 
        config.IMAGE.HEATMAP_HEIGHT,
        config.IMAGE.HEATMAP_WIDTH, 
        config.LOSSES, 
        num_frames=config.DATASET.NUM_FRAMES
    )

    val_loss_fn = KeypointLoss(config)

    if ddp_setup.is_main_process():
        checkpoint_dir = os.path.join(config.CHECKPOINT_DIRECTORY, config.CHECKPOINT_NAME)
        create_directory_if_not_exists(checkpoint_dir)
        checkpoint_path_latest = os.path.join(
            checkpoint_dir, 'latest_epoch.pth.tr')
        checkpoint_path_best = os.path.join(
            checkpoint_dir, 'best_epoch.pth.tr')
        checkpoint_path_best_pck = os.path.join(
            checkpoint_dir, 'best_pck_epoch.pth.tr')

        wandb_id = config.WANDB_ID if config.WANDB_ID != - \
            1 else str(uuid.uuid4())

        if config.FOLLOW_UP:
            checkpoint_path = config.PREVIOUS_CHECKPOINT
            if os.path.exists(checkpoint_path):
                checkpoint = torch.load(checkpoint_path, map_location=device)
                print(f"[INFO] Loading checkpoint from {checkpoint_path}")

                model_without_ddp.load_state_dict(checkpoint['model'], strict=True)
                optimizer.load_state_dict(checkpoint['optimizer'])

                # Optional: restore learning rates from 'lrs' field
                if 'lrs' in checkpoint:
                    for group, lr in zip(optimizer.param_groups, checkpoint['lrs']):
                        group['lr'] = lr
                    print(f"[INFO] Restored learning rates: {checkpoint['lrs']}")

                # Optional: resume from the right epoch
                if 'epoch' in checkpoint:
                    config.defrost()
                    config.START_EPOCH = checkpoint['epoch'] + 1
                    config.freeze()
                    print(f"[INFO] Resuming from epoch {config.START_EPOCH}")

                # Optional: restore WANDB ID
                if 'wandb_id' in checkpoint and config.WANDB_ID in [-1, None]:
                    wandb_id = checkpoint['wandb_id']
                    print(f"[INFO] Resuming WANDB run with ID: {wandb_id}")

            else:
                print(f"[WARN] Checkpoint path '{checkpoint_path}' does not exist. Starting from scratch.")

        if config.USE_WANDB:
            os.environ["WANDB__SERVICE_WAIT"] = "3000"
            print(
                f'[INFO] Increased the WANDB Service Wait time to {os.environ["WANDB__SERVICE_WAIT"]}')
            wandb_settings = {
                "id": wandb_id,
                "project": config.MODEL_NAME,
                "name": config.CHECKPOINT_NAME,
                "notes": str(config),
                "config": {
                    "dataset": config.DATASET.DATASET_NAME,
                    "epochs": config.EPOCH_NUMBER,
                    "run_id": wandb_id,
                },
                "settings": wandb.Settings(start_method='fork'),
            }

            wandb.init(**wandb_settings)
            print(f"[INFO] WANDB run initialized with ID: {wandb_id}")

    # Initial evaluation (before training) on rank 0
    if ddp_setup.is_main_process():
        print(f"[INFO] Initial GPU memory reserved: {torch.cuda.memory_reserved() / 1e6:.1f} MB")
    
    _ = evaluate(
        is_first_epoch=True,
        config=config,
        model=model,
        val_loader=val_loader,
        device=device,
        loss_fn=val_loss_fn,
        optimizer=optimizer
    )
    if config.EVAL_ONLY:
        return

    best_val_loss = float('inf')
    best_pck_05 = -float('inf')

    for epoch in range(config.START_EPOCH, config.EPOCH_NUMBER):
        if config.DISTRIBUTED:
            train_sampler.set_epoch(epoch)

        if ddp_setup.is_main_process():
            print(f"[INFO] Starting epoch {epoch}/{config.EPOCH_NUMBER}")

        train_metrics = train_one_epoch(
            is_first_epoch=(epoch == config.START_EPOCH),
            config=config,
            model=model,
            train_loader=train_loader,
            optimizer=optimizer,
            device=device,
            loss_fn=train_loss_fn
        )
        val_metrics = evaluate(
            is_first_epoch=(epoch == config.START_EPOCH),
            config=config,
            model=model,
            val_loader=val_loader,
            device=device,
            loss_fn=val_loss_fn,
            optimizer=optimizer
        )

        show_train_loss, total_train_loss = train_metrics
        show_val_loss, total_val_loss, heatmap_pck = val_metrics

        
        # Step scheduler if needed
        if scheduler is not None:
            if config.SCHEDULER_FCT == 'RRLP':
                scheduler.step(total_val_loss)
            elif config.SCHEDULER_FCT == 'cosine':
                scheduler.step()
            

        lrs = [group['lr'] for group in optimizer.param_groups]
        print(f"[INFO] Learning rates: {lrs}")

        if ddp_setup.is_main_process():
            if total_val_loss <= best_val_loss:
                best_val_loss = total_val_loss
                save_checkpoint(epoch, model_without_ddp, lrs, optimizer,
                                total_val_loss, wandb_id, checkpoint_path_best)
                print(
                    f'[INFO] Best model checkpoint saved at {checkpoint_path_best}')

            if epoch % 10 == 0:
                save_checkpoint(epoch, model_without_ddp, lrs, optimizer,
                                total_val_loss, wandb_id, checkpoint_path_latest)
                print(
                    f'[INFO] Temporary checkpoint saved for epoch: {epoch} at {checkpoint_path_latest}')

            if best_pck_05 <= heatmap_pck[0.05]:
                best_pck_05 = heatmap_pck[0.05]
                save_checkpoint(epoch, model_without_ddp, lrs, optimizer,
                                total_val_loss, wandb_id, checkpoint_path_best_pck)
                print(
                    f'[INFO] Best 0.05 PCK model checkpoint saved at {checkpoint_path_best_pck}')

            # Log metrics to WandB
            if config.USE_WANDB:
                lr_log = {f"LR_Group_{i}": lr for i, lr in enumerate(lrs)}
                log_dict = {
                    "Train Loss (ptwise)": show_train_loss,
                    "Val   Loss (ptwise)": show_val_loss,
                    "Total Train Loss": total_train_loss,
                    "Total Val   Loss": total_val_loss,
                    "Epoch": epoch,
                    "Best Val Loss": best_val_loss,
                    "Best PCK @.05": best_pck_05,
                    **lr_log,
                }
                for thr, val in heatmap_pck.items():
                    log_dict[f"Heatmap PCK ({thr})"] = val
                wandb.log(log_dict)
                print(f"[INFO] WandB log: {log_dict}")


    if ddp_setup.is_main_process():
        save_checkpoint(epoch - 1, model_without_ddp, lrs, optimizer,
                        show_val_loss, wandb_id, checkpoint_path_latest)
        # wandb.save(checkpoint_path_latest) # takes too much storage
        # wandb.save(checkpoint_path_best)
        print(
            f'[INFO] Final model checkpoint saved and uploaded to WANDB at {checkpoint_path_latest}')
        if config.USE_WANDB:
            wandb.finish()


def main():
    config = parse_args()
    set_random_seed(config.SEED)
    config = ddp_setup.init_distributed_mode(config)
    print(f'[INFO] Configuration: {config}')
    train(config)


if __name__ == '__main__':
    main()