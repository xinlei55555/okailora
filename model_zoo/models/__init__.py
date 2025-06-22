from peft import get_peft_model, LoraConfig, TaskType

def load_model(model_type, inference_mode=False):
    model = __import__(f"okailora.model_zoo.models.{model_type}", fromlist=['']).load_model()
    return _get_peft_model(model, model_type, inference_mode)

def _get_peft_model(model, model_type, inference_mode):
    if model_type == "classification":
        peft_config = LoraConfig(
            task_type=TaskType.IMAGE_CLASSIFICATION,  # or "IMAGE_CLASSIFICATION"
            inference_mode=False,
            r=8,
            lora_alpha=16,
            lora_dropout=0.1,
            target_modules=["qkv"],  # matches ViT self-attention in timm
        )
    
    elif model_type == "bbox":
        peft_config = LoraConfig(
            task_type=TaskType.OBJECT_DETECTION,
            inference_mode=inference_mode,
            r=8,
            lora_alpha=16,
            lora_dropout=0.1,
            target_modules=["qkv"],  # matches ViT self-attention in timm
        )

    elif model_type == "segmentation":
        peft_config = LoraConfig(
            task_type=TaskType.IMAGE_SEGMENTATION,
            inference_mode=inference_mode,
            r=8,
            lora_alpha=16,
            lora_dropout=0.1,
            target_modules=["qkv"],  # matches ViT self-attention in timm
        )
    
    elif model_type == 'generation':
        peft_config = LoraConfig(
            task_type=TaskType.FEATURE_EXTRACTION,  # or just TaskType.CAUSAL_LM if it’s transformer-based
            inference_mode=inference_mode,
            r=8,
            lora_alpha=16,
            lora_dropout=0.1,
            target_modules=["qkv"],  # or ["to_q", "to_k", "to_v"] depending on the architecture
        )   

    else:
        raise ValueError(f"Unsupported model type: {model_type}")
    return get_peft_model(model, peft_config)
