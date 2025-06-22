import os
from PIL import Image

from data.dataloader import BaseDataset

class SegmentationDataset(BaseDataset):
    def __init__(self, data_root_dir, mask_dir, transform=None):
        super().__init__(data_root_dir, transform)
        self.mask_dir = mask_dir

    def __getitem__(self, idx):
        img_path = self.samples[idx]
        mask_path = os.path.join(self.mask_dir, os.path.basename(img_path))
        image = Image.open(img_path).convert("RGB")
        mask = Image.open(mask_path)

        image = self.transform(image)
        mask = self.transform(mask)
        return image, mask
