import torch
import torch.nn as nn

class GenerationLoss(nn.Module):
    def __init__(self):
        super(GenerationLoss, self).__init__()
        self.loss_fn = nn.MSELoss()

    def forward(self, predictions, targets):
        return self.loss_fn(predictions, targets)