import { Api } from "mp-assistant-common/dist/api/index.js";
import { get, post, put, del } from "./request";

/**
 * 获取所有 Worker 信息
 */
export function requestGetWorkerInfos() {
    return get<Api.Worker.GetWorkerInfos.ResponseData>(
        Api.Worker.GetWorkerInfos.url
    );
}

/**
 * 获取指定 Worker 信息
 */
export function requestGetWorkerInfo(key: string) {
    return get<Api.Worker.GetWorkerInfo.ResponseData>(
        Api.Worker.GetWorkerInfo.url,
        { params: { key } }
    );
}

/**
 * 添加 Worker
 */
export function requestAddWorker(body: Api.Worker.AddWorker.RequestBody) {
    return post<Api.Worker.AddWorker.ResponseData>(
        Api.Worker.AddWorker.url,
        { body }
    );
}

/**
 * 删除 Worker
 */
export function requestRemoveWorker(key: string) {
    return del<Api.Worker.RemoveWorker.ResponseData>(
        Api.Worker.RemoveWorker.url,
        { params: { key } }
    );
}

/**
 * 修改 Worker
 */
export function requestUpdateWorker(key: string, body: Api.Worker.UpdateWorker.RequestBody) {
    return put<Api.Worker.UpdateWorker.ResponseData>(
        Api.Worker.UpdateWorker.url,
        { params: { key }, body }
    );
}

/**
 * 登录 Worker
 */
export function requestLoginWorker(key: string) {
    return post<Api.Worker.WorkerLogin.ResponseData>(
        Api.Worker.WorkerLogin.url,
        { params: { key } }
    );
}

/**
 * 获取 Worker 的小程序列表
 */
export function requestWorkerGetWxaList(key: string) {
    return get<Api.Worker.WorkerGetWxaList.ResponseData>(
        Api.Worker.WorkerGetWxaList.url,
        { params: { key } }
    );
}

/**
 * 添加任务
 */
export function requestAddTask(key: string, body: Api.Worker.AddTask.RequestBody) {
    return post<Api.Worker.AddTask.ResponseData>(
        Api.Worker.AddTask.url,
        { params: { key }, body }
    );
}

/**
 * 删除任务
 */
export function requestRemoveTask(key: string, taskKey: string) {
    return del<Api.Worker.RemoveTask.ResponseData>(
        Api.Worker.RemoveTask.url,
        { params: { key, taskKey } }
    );
}

/**
 * 获取任务信息
 */
export function requestGetTaskInfo(key: string, taskKey: string) {
    return get<Api.Worker.TaskInfo.ResponseData>(
        Api.Worker.TaskInfo.url,
        { params: { key, taskKey } }
    );
}

