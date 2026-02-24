import { APIErrorRes, APIRes, APISuccessRes } from "./type.js";

/**
 * 获取一个标准的 API 响应对象，默认 code 为 200，message 为空字符串，data 为 null
 * @param params 
 * @returns 
 */
export function getApiResponse<T>(data: T, code?: 200 | 400 | 401 | 403 | 404 | 500, message?: string): APIRes<T> {
    return {
        code: code ?? 200,
        message: message ?? '',
        data: data,
    }
}

export function getSuccessApiResponse<T>(data: T, message?: string): APISuccessRes<T> {
    return getApiResponse(data, 200, message) as APISuccessRes<T>;
}

export function getErrorApiResponse(message: string, code: 400 | 401 | 403 | 404 | 500 = 500): APIErrorRes {
    return {
        code,
        message,
        data: null,
    }
}