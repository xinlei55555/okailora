import torch.nn as nn
from .lora import LoRALinear

def load_model(config, inference_mode=False):
    model_type = config.MODEL_NAME
    model = __import__(f"models.{model_type}", fromlist=['']).load_model(config)
    
    def _get_lora_model(model, model_type, inference_mode):
        if model_type == "classification":
            target_modules = ["attn.qkv"]
            unfreeze_keywords = ["head", "lora_A", "lora_B"]
        elif model_type == "bbox":
            target_modules = ["qkv"]
        elif model_type == "segmentation":
            target_modules = ["qkv"]
        elif model_type == "generation":
            target_modules = ["qkv"]
        else:
            raise ValueError(f"Unsupported model type: {model_type}")

         # Step 1: Collect modules to modify
        modules_to_patch = []
        for name, module in model.named_modules():
            if any(target in name for target in target_modules):
                if isinstance(module, nn.Linear):
                    modules_to_patch.append((name, module))

        # Step 2: Apply LoRA modifications
        for name, module in modules_to_patch:
            # Navigate to parent module
            parent = model
            components = name.split(".")
            for comp in components[:-1]:
                parent = getattr(parent, comp)
            setattr(parent, components[-1], LoRALinear(module))

        return model, unfreeze_keywords

    lora_model, unfreeze_keywords = _get_lora_model(model, model_type, inference_mode)
    
    # Freeze the layers based on keywords
    for name, param in lora_model.named_parameters():
        if any(keyword in name for keyword in unfreeze_keywords):
            param.requires_grad = True
        else:
            param.requires_grad = False
    return lora_model


