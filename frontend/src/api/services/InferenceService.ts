/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class InferenceService {
    /**
     * List inference deployments
     * Returns a list of all inference deployments.
     * @returns any A JSON array of inference deployments
     * @throws ApiError
     */
    public static inferenceList(): CancelablePromise<Array<{
        deployment_id?: string;
        type?: string;
        description?: string;
    }>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/inference/list',
        });
    }
    /**
     * Upload data for inference
     * Uploads data required for inference.
     * @param deploymentId
     * @param formData
     * @returns any Data uploaded successfully
     * @throws ApiError
     */
    public static inferenceUploadData(
        deploymentId: string,
        formData: {
            /**
             * Data file for inference
             */
            file?: Blob;
        },
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/inference/upload_data',
            headers: {
                'deployment_id': deploymentId,
            },
            formData: formData,
            mediaType: 'multipart/form-data',
        });
    }
    /**
     * Start inference
     * Begins inference on the uploaded data.
     * @param deploymentId
     * @param requestBody
     * @returns any Inference started
     * @throws ApiError
     */
    public static inferenceStart(
        deploymentId: string,
        requestBody: Record<string, any>,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/inference/start',
            headers: {
                'deployment_id': deploymentId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Inference status
     * Get status of inference job
     * @param deploymentId
     * @returns any Status of inference job
     * @throws ApiError
     */
    public static inferenceStatus(
        deploymentId: string,
    ): CancelablePromise<{
        finished: boolean;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/inference/status',
            headers: {
                'deployment_id': deploymentId,
            },
        });
    }
    /**
     * Get inference weights
     * Retrieves the current weights/configuration for inference.
     * @param deploymentId
     * @returns any Current inference weights
     * @throws ApiError
     */
    public static inferenceWeights(
        deploymentId: string,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/inference/weights',
            headers: {
                'deployment_id': deploymentId,
            },
        });
    }
}
