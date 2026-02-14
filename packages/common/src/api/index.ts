import { ApiResponse } from "./type.js";
import { ConfigApi } from './config.js';
import { WorkerApi } from './worker.js';

export const ApiPrefix = '/api';

export function getApiResponse<T>(params: { code?: 200 | 400 | 401 | 403 | 404 | 500, message?: string, data?: T } = {}): ApiResponse<T> {
    const { code = 200, message, data } = params;
    return {
        code,
        message: message ?? '',
        data: data ?? undefined,
    }
}

export namespace Api {
    export import Config = ConfigApi;
    export import Worker = WorkerApi;
}
