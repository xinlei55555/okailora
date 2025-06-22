import os
from PIL import Image

from data.dataloader import BaseDataset

class GenerationDataset(BaseDataset):
    def __init__(self, data_root_dir, transform=None):
        super().__init__(data_root_dir, transform)

    def __getitem__(self, idx):
        input_path = self.samples[idx]
        input_img = Image.open(input_path).convert("RGB")
        input_img = self.transform(input_img)
        return input_img
