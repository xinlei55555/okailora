cd ..
python3 train.py \
    --config classification.yaml \
    --data_path 'data/datasets/hyperkvasir_dataset'\
    --deployment_id hyperkvasir_dataset \
    --num_epochs 50 \
    > train.log 2>&1

python3 train.py \
    --config classification.yaml \
    --data_path 'data/inference_datasets/hyperkvasir_dataset'\
    --deployment_id hyperkvasir_dataset \
    --inference_mode 1 \
    > val.log 2>&1

cd scripts


# https://www.kaggle.com/datasets/paultimothymooney/chest-xray-pneumonia

# cd ..
# python3 train.py \
#     --config classification.yaml \
#     --data_path 'data/datasets/lung_kaggle'\
#     --deployment_id lung_kaggle \
#     --num_epochs 150 \
#     > train.log 2>&1

# python3 train.py \
#     --config classification.yaml \
#     --data_path 'data/inference_datasets/lung_kaggle'\
#     --deployment_id lung_kaggle \
#     --inference_mode 1 \
#     > val.log 2>&1

# cd scripts
