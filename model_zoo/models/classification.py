import os
import timm
import torch

def load_model(config):
    # check number of subfolders in dataset_dir
    dataset_dir = config.DATASET.DATASET_PATH
    num_classes = len([name for name in os.listdir(dataset_dir) if os.path.isdir(os.path.join(dataset_dir, name))])
    # Load pretrained ViT (same as 'vit-base-patch16-224')
    model = timm.create_model('vit_base_patch16_224', pretrained=True)

    # freeze the pretrained weights:
    for param in model.parameters():
        param.requires_grad = False

    # # If you're doing classification and want to change the number of output classes:
    model.head = torch.nn.Linear(model.head.in_features, num_classes)  # for 10 classes

    # unfreeze the head layer:
    for param in model.head.parameters():
        param.requires_grad = True
    return model

