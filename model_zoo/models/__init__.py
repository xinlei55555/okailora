from peft import get_peft_model, LoraConfig, TaskType

def load_model(config, inference_mode=False):
    model_type = config.MODEL_NAME
    model = __import__(f"models.{model_type}", fromlist=['']).load_model(config)
    return model
    # lora_model, unfreeze_keywords = _get_peft_model(model, model_type, inference_mode)
    
    # # Freeze the layers based on keywords
    # for name, param in lora_model.named_parameters():
    #     if any(keyword in name for keyword in unfreeze_keywords):
    #         param.requires_grad = True
    #     else:
    #         param.requires_grad = False
    # return lora_model

def _get_peft_model(model, model_type, inference_mode):
    if model_type == "classification":
        peft_config = LoraConfig(
            task_type=TaskType.FEATURE_EXTRACTION,  # ✅ correct for ViT from timm
            inference_mode=inference_mode,
            r=8,
            lora_alpha=16,
            lora_dropout=0.1,
            target_modules=["attn.qkv"],  # ✅ this is the right one for timm ViTs
        )
        # Freeze everything
        unfreeze_keywords = ['lora', 'head']
        
    elif model_type == "bbox":
        peft_config = LoraConfig(
            task_type=TaskType.FEATURE_EXTRACTION,
            inference_mode=inference_mode,
            r=8,
            lora_alpha=16,
            lora_dropout=0.1,
            target_modules=["qkv"],  # matches ViT self-attention in timm
        )
        unfreeze_keywords = ['lora']

    elif model_type == "segmentation":
        peft_config = LoraConfig(
            task_type=TaskType.FEATURE_EXTRACTION,
            inference_mode=inference_mode,
            r=8,
            lora_alpha=16,
            lora_dropout=0.1,
            target_modules=["qkv"],  # matches ViT self-attention in timm
        )
        unfreeze_keywords = ['lora']

    elif model_type == 'generation':
        peft_config = LoraConfig(
            task_type=TaskType.FEATURE_EXTRACTION,  # or just TaskType.CAUSAL_LM if it’s transformer-based
            inference_mode=inference_mode,
            r=8,
            lora_alpha=16,
            lora_dropout=0.1,
            target_modules=["qkv"],  # or ["to_q", "to_k", "to_v"] depending on the architecture
        )   
        unfreeze_keywords = ['lora']

    else:
        raise ValueError(f"Unsupported model type: {model_type}")
    return get_peft_model(model, peft_config), unfreeze_keywords
