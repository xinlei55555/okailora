import os
from torch.utils.data import Dataset
from torchvision import transforms

class BaseDataset(Dataset):
    def __init__(self, data_root_dir, transform=None, inference=False):
        self.data_root_dir = data_root_dir
        self.transform = transform if transform else self._base_reshape(img_shape=224)
        self.samples = self._scan_files()
        self.inference = inference
        print(f"Found {len(self.samples)} samples in {data_root_dir}")

    def _scan_files(self):
        return sorted([
            os.path.join(self.data_root_dir, fname)
            for fname in os.listdir(self.data_root_dir)
            if fname.lower().endswith(('.png', '.jpg', '.jpeg'))
        ])

    def _base_reshape(self, img_shape=224):
        transform = transforms.Compose([
            transforms.Resize((img_shape, img_shape)),
            transforms.ToTensor()
        ])
        return transform

    def __len__(self):
        return len(self.samples)

    def reshape(self, new_transform):
        self.transform = new_transform

    def __getitem__(self, idx):
        raise NotImplementedError("Use a child class like SegmentationDataset, etc.")

def load_dataset(model_type):
    from . import (
        bbox_dataset,
        generation_dataset,
        classification_dataset,
        segmentation_dataset
    )
    
    if model_type == 'bbox':
        return bbox_dataset.BboxDataset
    elif model_type == 'generation':
        return generation_dataset.GenerationDataset
    elif model_type == 'classification':
        return classification_dataset.ClassificationDataset
    elif model_type == 'segmentation':
        return segmentation_dataset.SegmentationDataset
    else:
        raise ValueError(f"Unknown model type: {model_type}")

    
def load_dataset_instance(model_type, data_root_dir, transform=None, inference=False, class_to_idx=None):
    dataset_class = load_dataset(model_type)
    dataset_kwargs = {
        'data_root_dir': data_root_dir,
        'transform': transform
    }
    if model_type == 'bbox':
        dataset_kwargs['bbox_json_path'] = os.path.join(data_root_dir, 'bbox.json')
    
    if model_type == 'classification':
        return dataset_class(data_root_dir=data_root_dir, transform=transform, inference=inference, class_to_idx=class_to_idx)

    else:
        return dataset_class(data_root_dir=data_root_dir, transform=transform, inference=inference,)