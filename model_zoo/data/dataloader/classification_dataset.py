import json
from PIL import Image
import torch
import os

from data.dataloader import BaseDataset

class ClassificationDataset(BaseDataset):
    def __init__(self, data_root_dir, transform=None, inference=False, class_to_idx=None):
        super().__init__(data_root_dir, transform, inference)
        if class_to_idx is not None:
            self.class_to_idx = class_to_idx
        else:
            self.class_to_idx = {
                class_name: i for i, class_name in enumerate(sorted(os.listdir(data_root_dir)))
            }
        self.num_classes = len(self.class_to_idx)
    
    def get_num_classes(self):
        return self.num_classes

    # Override 
    def _scan_files(self):
        image_exts = ('.png', '.jpg', '.jpeg')
        all_files = []
        for root, _, files in os.walk(self.data_root_dir):
            for fname in files:
                if fname.lower().endswith(image_exts):
                    all_files.append(os.path.join(root, fname))
        return sorted(all_files)        
        
    def __getitem__(self, idx):
        img_path = self.samples[idx]
        image = Image.open(img_path).convert("RGB")
        image = self.transform(image)
        if not self.inference:
            label_name = os.path.basename(os.path.dirname(img_path))
            label = self.class_to_idx[label_name]
            return image, torch.tensor(label)
        else:
            return image, img_path