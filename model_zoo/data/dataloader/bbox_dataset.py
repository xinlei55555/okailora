import torch
from PIL import Image
import json
import os

from data.dataloader import BaseDataset

class BboxDataset(BaseDataset):
    def __init__(self, root_dir, bbox_json_path, transform=None):
        super().__init__(root_dir, transform)
        with open(bbox_json_path, 'r') as f:
            self.bboxes = json.load(f)  # {filename: [[x1,y1,x2,y2], ...]}
    
    def __getitem__(self, idx):
        img_path = self.samples[idx]
        image = Image.open(img_path).convert("RGB")
        boxes = self.bboxes.get(os.path.basename(img_path), [])

        image = self.transform(image)
        boxes = torch.tensor(boxes, dtype=torch.float32)
        return image, boxes
