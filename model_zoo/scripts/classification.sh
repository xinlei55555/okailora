cd ..
python3 train.py \
    --config classification.yaml \
    --data_path 'data/datasets/u1111'\
    --deployment_id u1111 \
    --num_epochs 5 \
    > train.log 2>&1

python3 train.py \
    --config classification.yaml \
    --data_path 'data/inference_datasets/u1111'\
    --deployment_id u1111 \
    --inference_mode 1 \
    > val.log 2>&1

cd scripts
