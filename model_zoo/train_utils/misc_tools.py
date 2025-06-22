import os
import torch
import random
import numpy as np

import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def set_random_seed(seed):
    """Sets random seed for training reproducibility
    
    Args:
        seed (int)"""
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    torch.cuda.manual_seed_all(seed)

def create_directory_if_not_exists(path):
    '''Creates a directory if such a directory does not exist'''
    if not os.path.exists(path):
        os.makedirs(path)

def count_param_numbers(model):
    '''Returns the number of parameters in a given model
    
    Args:
        model (nn.Module)
    '''
    model_params = 0
    for parameter in model.parameters():
        model_params = model_params + parameter.numel()
    return model_params

def save_checkpoint(model, checkpoint_path):
    '''Save only unfrozen (trainable) model weights and other training states'''
    
    # Filter only parameters that require gradients
    trainable_state_dict = {
        name: param for name, param in model.state_dict().items()
        if model.get_parameter(name).requires_grad
    }

    torch.save({
        'model': trainable_state_dict,
    }, checkpoint_path)