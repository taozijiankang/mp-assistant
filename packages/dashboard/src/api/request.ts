import { ElMessage } from "element-plus";
import { ApiPrefix } from "mp-assistant-common/dist/api/index.js";
import type { APIRes, APISuccessRes } from "mp-assistant-common/dist/api/type";
import qs from "qs";

/**
 * 获取 API 基础 URL
 * 生产环境下使用相对路径（同源部署），开发环境通过 vite proxy 代理
 */
const getBaseURL = () => {
    return new URL(ApiPrefix, import.meta.env.VITE_API_URL).href;
};

export interface RequestOptions {
    method?: string,
    query?: Record<string, string>;
    body?: any;
    headers?: Record<string, string>;
}

/**
 * 通用请求方法
 */
export async function request<T>(
    url: string,
    options: RequestOptions = {}
): Promise<APISuccessRes<T>> {
    const { method = "GET", query, body, headers } = options;
    const resolvedURL = getBaseURL() + url + (query ? `?${qs.stringify(query)}` : "");

    const fetchOptions: RequestInit = {
        method: method.toUpperCase(),
        headers: {
            "Content-Type": "application/json",
            ...headers,
        },
        body: method.toUpperCase() !== "GET" ? JSON.stringify(body || {}) : undefined,
    };

    let response: Response;
    try {
        response = await fetch(resolvedURL, fetchOptions);
    } catch (error) {
        ElMessage.error(error instanceof Error ? error.message : String(error));
        throw error;
    }

    if (!response.ok) {
        ElMessage.error(`HTTP Error: ${response.status} ${response.statusText}`);
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
    }

    const resData: APIRes<T> = await response.json();
    if (resData.code !== 200) {
        ElMessage.error(resData.message || "API Error");
        throw new Error(resData.message);
    }
    return resData as APISuccessRes<T>;
}

