from loss.segmentation_loss import SegmentationLoss
from loss.classification_loss import ClassificationLoss
from loss.bbox_loss import BboxLoss
from loss.generation_loss import GenerationLoss

def get_loss_function(model_type):
    if model_type == 'segmentation':
        return SegmentationLoss()
    elif model_type == 'classification':
        return ClassificationLoss()
    elif model_type == 'bbox':
        return BboxLoss()
    elif model_type == 'generation':
        return GenerationLoss()
    else:
        raise ValueError(f"Unknown model type: {model_type}")