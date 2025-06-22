/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class TrainService {
    /**
     * Upload training data (zip)
     * Creates the deployment if it does not exist, then uploads a ZIP of training data.
     * @param deploymentId
     * @param formData
     * @returns any Data uploaded successfully
     * @throws ApiError
     */
    public static trainUploadData(
        deploymentId: string,
        formData: {
            /**
             * Zip file containing training data
             */
            file?: Blob;
        },
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/train/upload_data',
            headers: {
                'deployment_id': deploymentId,
            },
            formData: formData,
            mediaType: 'multipart/form-data',
            errors: {
                400: `Bad request`,
            },
        });
    }
    /**
     * Start training
     * Begins training for the given model type.
     * @param deploymentId
     * @param requestBody
     * @returns any Training started
     * @throws ApiError
     */
    public static trainStart(
        deploymentId: string,
        requestBody: {
            /**
             * Type of model to train
             */
            model_type: 'classification' | 'segmentation' | 'generation' | 'bbox';
        },
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/train/start',
            headers: {
                'deployment_id': deploymentId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid request (e.g., unknown model_type)`,
            },
        });
    }
    /**
     * Train status
     * Get status of train job
     * @param deploymentId
     * @returns any Status of train job
     * @throws ApiError
     */
    public static trainStatus(
        deploymentId: string,
    ): CancelablePromise<{
        finished: boolean;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/train/status',
            headers: {
                'deployment_id': deploymentId,
            },
        });
    }
}
