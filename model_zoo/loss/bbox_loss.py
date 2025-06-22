import torch
import torch.nn as nn

class BboxLoss(nn.Module):
    def __init__(self):
        super(BboxLoss, self).__init__()
        self.regression_loss = nn.SmoothL1Loss()
        self.classification_loss = nn.CrossEntropyLoss()

    def forward(self, bbox_predictions, bbox_targets, class_predictions, class_targets):
        regression_loss = self.regression_loss(bbox_predictions, bbox_targets)
        classification_loss = self.classification_loss(class_predictions, class_targets)
        return regression_loss + classification_loss