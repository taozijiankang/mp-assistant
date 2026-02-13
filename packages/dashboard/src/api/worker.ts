import { Api } from "mp-assistant-common/dist/api/index.js";
import { get, post, put, del } from "./request";

/**
 * 获取所有 Worker 信息
 */
export function getWorkerInfos() {
    return get<Api.Worker.GetWorkerInfos.ResponseData>(
        Api.Worker.GetWorkerInfos.url
    );
}

/**
 * 获取指定 Worker 信息
 */
export function getWorkerInfo(key: string) {
    return get<Api.Worker.GetWorkerInfo.ResponseData>(
        Api.Worker.GetWorkerInfo.url,
        { params: { key } }
    );
}

/**
 * 添加 Worker
 */
export function addWorker(body: Api.Worker.AddWorker.RequestBody) {
    return post<Api.Worker.AddWorker.ResponseData>(
        Api.Worker.AddWorker.url,
        { body }
    );
}

/**
 * 删除 Worker
 */
export function removeWorker(key: string) {
    return del<Api.Worker.RemoveWorker.ResponseData>(
        Api.Worker.RemoveWorker.url,
        { params: { key } }
    );
}

/**
 * 修改 Worker
 */
export function updateWorker(key: string, body: Api.Worker.UpdateWorker.RequestBody) {
    return put<Api.Worker.UpdateWorker.ResponseData>(
        Api.Worker.UpdateWorker.url,
        { params: { key }, body }
    );
}

/**
 * 添加任务
 */
export function addTask(key: string, body: Api.Worker.AddTask.RequestBody) {
    return post<Api.Worker.AddTask.ResponseData>(
        Api.Worker.AddTask.url,
        { params: { key }, body }
    );
}

/**
 * 删除任务
 */
export function removeTask(key: string, taskKey: string) {
    return del<Api.Worker.RemoveTask.ResponseData>(
        Api.Worker.RemoveTask.url,
        { params: { key, taskKey } }
    );
}

/**
 * 获取任务信息
 */
export function getTaskInfo(key: string, taskKey: string) {
    return get<Api.Worker.TaskInfo.ResponseData>(
        Api.Worker.TaskInfo.url,
        { params: { key, taskKey } }
    );
}

