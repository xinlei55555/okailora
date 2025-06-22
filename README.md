# OkaiLoRa
## Inspiration
In the medical AI space, clinicians and researchers often sit on high-value datasets but lack the tools and the time to turn them into actionable machine learning models. 

The current paradigm involves outsourcing to middlemen, which are ML engineers, who have no idea what the medical imaging data represents. Yet, even when the models are trained, they often need to remain proprietary due to data privacy issues, which stop medical healthcare professionals from sharing their data, and enabling wide-spread sharing of their training pipeline.

We wanted to flip that model: what if any medical professional could train and deploy state-of-the-art models themselves, in minutes, no code required?
What if, instead of sharing data, they could encode their hundreds of GB of data into a low-level representations, which could be added to pretrained models for fast-shareable inference?

## What it does
OKaiLoRa.ai is a no-code platform that simplifies healthcare model training, fine-tuning, and model sharing platform which allows medical professionals to:

1. Upload image data for classification, segmentation, generation, or object detection, within our deployment server.

2. Select from a curated set of pre-trained models, which encompass the mainstream medical healthcare tasks, such as image classification, image segmentation, bounding box detection and generation.

3. Train lightweight LoRa adapters on limited hardware (even with just 6GB VRAM)!

4. Track training metrics in real-time, no code, no setup!

5. Share inference-ready models via secure Tailscale-powered links which point to the LoRa weight  and fine-tuned weight checkpoints, keeping patient private data secure.

## How we built it
**Frontend**: Built in React, the UI supports drag-and-drop data uploads, dynamic sliders for model configuration, and real-time progress displays for accuracies, loss, and epoch.

**Backend**: Powered by SpringBoot in Kotlin, we provide a robust REST API layer with the following key endpoints:
/train/upload_data for zipped datasets.
/train/start, /train/progress to manage and monitor training jobs.
/inference/start, /inference/weights for remote model access.

**Training Engine**: Uses PyTorch for clean training logic. LoRa adapters enable rapid fine-tuning with minimal GPU memory

**Hyperparameter tuning**:
- Learning Rate Scheduler: Integrates the ScheduleFree optimizer, from the FAIR lab, which offers scheduler free learning rate optimizers for training pipeline (see NeurIPS 2025 paper: https://arxiv.org/pdf/2405.15682)
- Batch size is adapted automatically to fit the GPUs.
- Epoch number is customizable both by the user, or can be left at the default of 50
- The classification pipeline supports any number of classes, determined through the files uploaded.

**Networking**: Tailscale makes it easy to securely run inference from a shared link, ideal for labs or remote teams.

**Data Handling**: Supports user-defined deployment_ids to track versions and LoRA adapter checkpoints for each model and dataset.

## Accomplishments that we're proud of
End-to-end drag-and-drop model training and inference with zero coding.

Fully operational cross-stack integration (React ↔ Spring Boot ↔ PyTorch).

Remote inference sharing via Tailscale and LoRA-based portability.

Demonstrated rapid overfitting on small datasets to prove model training is functional and correct.

## What we learned
Kotlin + Spring Boot provides a surprisingly clean and scalable backend for ML workflows.

LoRa adapters are a game-changer for low-resource training and are so lightweight that we can use them to share fine-tuned models instead of full heavy ViT checkpoints!

## What's next for OKaiLoRa.ai
We are currently hosted on our local servers, and would love to deploy to 
LoRa model hub: Upload and download LoRa weights like plugins for base models.

Vision-language support: Let users describe tasks (e.g. “classify tumor types”) and auto-generate configurations.

Research collaboration platform: Encourage ML researchers to submit healthcare models to our template zoo, following our standard.

