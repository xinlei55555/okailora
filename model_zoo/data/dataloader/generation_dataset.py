import os
from PIL import Image

from data.dataloader import BaseDataset

class GenerationDataset(BaseDataset):
    def __init__(self, input_dir, target_dir, transform=None):
        super().__init__(input_dir, transform)
        self.target_dir = target_dir

    def __getitem__(self, idx):
        input_path = self.samples[idx]
        target_path = os.path.join(self.target_dir, os.path.basename(input_path))

        input_img = Image.open(input_path).convert("RGB")
        target_img = Image.open(target_path).convert("RGB")

        input_img = self.transform(input_img)
        target_img = self.transform(target_img)
        return input_img, target_img
