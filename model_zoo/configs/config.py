import os
from yacs.config import CfgNode as CN

cfg = CN(new_allowed=True)

def get_cfg_defaults():
    """Get a yacs CfgNode object with default values for my_project."""
    # Return a clone so that the defaults will not be altered
    # This is for the "local variable" use pattern
    return cfg.clone()

def replace_root_dir(cfg_node, root_dir):
    """
    Recursively replace all instances of '${ROOT_DIR}' with `root_dir` in a CfgNode.
    """
    for key, value in cfg_node.items():
        if isinstance(value, str) and '${ROOT_DIR}' in value:
            cfg_node[key] = value.replace('${ROOT_DIR}', root_dir)
        elif isinstance(value, CN):
            replace_root_dir(value, root_dir)

def get_cfg(
        config_file,
        root_dir,
        num_epochs,
        batch_size,
        model_uuid,
        use_wandb,
        checkpoint_name,
        dataset_path,
        inference_mode=False
    ):
    """
    Define configuration.
    """
    _cfg = get_cfg_defaults()
    config_file_path = os.path.join(root_dir, 'configs', config_file)
    if os.path.exists(config_file_path):
        print("[INFO] Loading config file: ", config_file_path)
        _cfg.merge_from_file(config_file_path)
    
    _cfg.defrost()
    _cfg.EPOCH_NUMBER = _cfg.EPOCH_NUMBER if num_epochs == -1 else num_epochs
    _cfg.CHECKPOINT_NAME = checkpoint_name if checkpoint_name is not None else _cfg.CHECKPOINT_NAME
    _cfg.MODEL.UUID = model_uuid if model_uuid is not None else _cfg.MODEL.UUID
    _cfg.BATCH_SIZE = batch_size if batch_size is not None else _cfg.BATCH_SIZE
    _cfg.WANDB.USE_WANDB = use_wandb if use_wandb is not None else _cfg.WANDB.USE_WANDB
    _cfg.DATASET.DATASET_PATH = dataset_path if dataset_path is not None else _cfg.DATASET.DATASET_PATH
    _cfg.EVAL_ONLY = inference_mode if inference_mode is not None else _cfg.EVAL_ONLY
    if use_wandb:
        _cfg.WANDB.WANDB_ID = _cfg.MODEL.UUID

    # Replace ${ROOT_DIR} globally in the configuration
    replace_root_dir(_cfg, root_dir)
    _cfg.freeze()

    # modify global cfg for use outside of this function
    cfg.merge_from_other_cfg(_cfg)
    return _cfg.clone()