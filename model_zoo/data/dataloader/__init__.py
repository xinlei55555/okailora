import os
from torch.utils.data import Dataset
from torchvision import transforms

class BaseDataset(Dataset):
    def __init__(self, root_dir, transform=None):
        self.root_dir = root_dir
        self.transform = transform if transform else self._base_reshape(img_shape=224)
        self.samples = self._scan_files()

    def _scan_files(self):
        return sorted([
            os.path.join(self.root_dir, fname)
            for fname in os.listdir(self.root_dir)
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
