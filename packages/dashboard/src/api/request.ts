import { ApiPrefix } from "mp-assistant-common/dist/api/index.js";
import type { ApiResponse } from "mp-assistant-common/dist/api/type.js";

/**
 * 获取 API 基础 URL
 * 生产环境下使用相对路径（同源部署），开发环境通过 vite proxy 代理
 */
const getBaseURL = () => {
    return import.meta.env.VITE_API_URL + ApiPrefix;
};

/**
 * 将 URL 模板中的 :param 替换为实际值
 */
function resolveURL(url: string, params?: Record<string, string>): string {
    if (!params) return url;
    let resolved = url;
    for (const [key, value] of Object.entries(params)) {
        resolved = resolved.replace(`:${key}`, encodeURIComponent(value));
    }
    return resolved;
}

export interface RequestOptions {
    params?: Record<string, string>;
    body?: any;
    headers?: Record<string, string>;
}

/**
 * 通用请求方法
 */
async function request<T>(
    method: string,
    url: string,
    options: RequestOptions = {}
): Promise<ApiResponse<T>> {
    const { params, body, headers } = options;
    const resolvedURL = getBaseURL() + resolveURL(url, params);

    const fetchOptions: RequestInit = {
        method,
        headers: {
            "Content-Type": "application/json",
            ...headers,
        },
    };

    if (method !== "GET") {
        fetchOptions.body = JSON.stringify(body || {});
    }

    const response = await fetch(resolvedURL, fetchOptions);

    if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
    }

    const data: ApiResponse<T> = await response.json();
    if (data.code !== 200) {
        throw new Error(data.message);
    }
    return data;
}

/**
 * GET 请求
 */
export function get<T>(url: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return request<T>("GET", url, options);
}

/**
 * POST 请求
 */
export function post<T>(url: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return request<T>("POST", url, options);
}

/**
 * PUT 请求
 */
export function put<T>(url: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return request<T>("PUT", url, options);
}

/**
 * DELETE 请求
 */
export function del<T>(url: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return request<T>("DELETE", url, options);
}

