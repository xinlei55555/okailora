import json
from PIL import Image
import torch
import os

from data.dataloader import BaseDataset

class ClassificationDataset(BaseDataset):
    def __init__(self, root_dir, label_map_path, transform=None):
        super().__init__(root_dir, transform)
        with open(label_map_path, 'r') as f:
            self.label_map = json.load(f)
        
    def __getitem__(self, idx):
        img_path = self.samples[idx]
        image = Image.open(img_path).convert("RGB")
        label = self.label_map[os.path.basename(img_path)]
        image = self.transform(image)
        return image, torch.tensor(label)
