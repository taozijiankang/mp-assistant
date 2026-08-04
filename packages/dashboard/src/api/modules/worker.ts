import { Api } from "@mp-assistant/common/dist/api/index.js";
import { request } from "../request";

export function requestGetWorkerList() {
    return request<Api.Worker.GetWorkerList.ResponseData>(
        Api.Worker.GetWorkerList.url,
        { method: Api.Worker.GetWorkerList.method }
    );
}

export function requestGetWorkerDetail(key: string) {
    return request<Api.Worker.GetWorkerDetail.ResponseData>(
        Api.Worker.GetWorkerDetail.url,
        { method: Api.Worker.GetWorkerDetail.method, query: { key } }
    );
}

export function requestAddWXWorker(body: Api.Worker.AddWXWorker.RequestBody) {
    return request<Api.Worker.AddWXWorker.ResponseData>(
        Api.Worker.AddWXWorker.url,
        { method: Api.Worker.AddWXWorker.method, body }
    );
}

export function requestPauseAndRecoverWorker(key: string, suspend: boolean) {
    return request<Api.Worker.PauseAndRecoverWorker.ResponseData>(
        Api.Worker.PauseAndRecoverWorker.url,
        { method: Api.Worker.PauseAndRecoverWorker.method, query: { key, suspend: String(suspend) } }
    );
}

export function requestRemoveWorker(key: string) {
    return request<Api.Worker.RemoveWorker.ResponseData>(
        Api.Worker.RemoveWorker.url,
        { method: Api.Worker.RemoveWorker.method, query: { key } }
    );
}

export function requestUpdateWorker(key: string, body: Api.Worker.UpdateWorker.RequestBody) {
    return request<Api.Worker.UpdateWorker.ResponseData>(
        Api.Worker.UpdateWorker.url,
        { method: Api.Worker.UpdateWorker.method, query: { key }, body }
    );
}

export function requestMarkWXAppId(key: string, body: Api.Worker.MarkWXAppId.RequestBody) {
    return request<Api.Worker.MarkWXAppId.ResponseData>(
        Api.Worker.MarkWXAppId.url,
        { method: Api.Worker.MarkWXAppId.method, query: { key }, body }
    );
}

export function requestClearAllMarkWXAppIds(key: string) {
    return request<Api.Worker.ClearAllMarkWXAppIds.ResponseData>(
        Api.Worker.ClearAllMarkWXAppIds.url,
        { method: Api.Worker.ClearAllMarkWXAppIds.method, query: { key } }
    );
}

export function requestAddTask(key: string, body: Api.Worker.AddTask.RequestBody) {
    return request<Api.Worker.AddTask.ResponseData>(
        Api.Worker.AddTask.url,
        { method: Api.Worker.AddTask.method, query: { key }, body }
    );
}

export function requestRemoveTask(key: string, taskKey: string) {
    return request<Api.Worker.RemoveTask.ResponseData>(
        Api.Worker.RemoveTask.url,
        { method: Api.Worker.RemoveTask.method, query: { key, taskKey } }
    );
}

export function requestGetTaskDetail(key: string, taskKey: string) {
    return request<Api.Worker.TaskDetail.ResponseData>(
        Api.Worker.TaskDetail.url,
        { method: Api.Worker.TaskDetail.method, query: { key, taskKey } }
    );
}

export function requestAbortTask(key: string, taskKey: string) {
    return request<Api.Worker.AbortTask.ResponseData>(
        Api.Worker.AbortTask.url,
        { method: Api.Worker.AbortTask.method, query: { key, taskKey } }
    );
}

export function requestResetTaskStatus(key: string, taskKey: string) {
    return request<Api.Worker.ResetTaskStatus.ResponseData>(
        Api.Worker.ResetTaskStatus.url,
        { method: Api.Worker.ResetTaskStatus.method, query: { key, taskKey } }
    );
}
