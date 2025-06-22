import timm
import torch

def load_model():
    # Load pretrained ViT (same as 'vit-base-patch16-224')
    model = timm.create_model('vit_base_patch16_224', pretrained=True)

    # freeze the pretrained weights:
    for param in model.parameters():
        param.requires_grad = False

    # add lora layers:

    # If you're doing classification and want to change the number of output classes:
    model.head = torch.nn.Linear(model.head.in_features, 10)  # for 10 classes
    return model

