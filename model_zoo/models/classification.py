import os
import timm
import torch
import torch.nn as nn

def load_model(config):
    # check number of subfolders in dataset_dir
    dataset_dir = config.DATASET.DATASET_PATH
    num_classes = config.MODEL.NUM_CLASSES 
    
    # Load pretrained ViT (same as 'vit-base-patch16-224')
    model = timm.create_model('vit_base_patch16_224', pretrained=True)

    # freeze the pretrained weights:
    for param in model.parameters():
        param.requires_grad = False

    # Replace the classification head with a small MLP
    in_features = model.head.in_features
    model.head = nn.Sequential(
        nn.Linear(in_features, 512),
        nn.ReLU(),
        nn.Dropout(0.3),
        nn.Linear(512, 128),
        nn.ReLU(),
        nn.Dropout(0.3),
        nn.Linear(128, num_classes)
    )

    # Unfreeze only the new head
    for param in model.head.parameters():
        param.requires_grad = True

    return model

