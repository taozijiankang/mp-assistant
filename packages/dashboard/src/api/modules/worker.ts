import { Api } from "@mp-assistant/common/dist/api/index.js";
import { request } from "../request";

export function requestGetWorkerList() {
    return request<Api.Worker.GetWorkerList.ResponseData>(
        Api.Worker.GetWorkerList.url,
        { method: Api.Worker.GetWorkerList.method }
    );
}

export function requestAddWXWorker(body: Api.Worker.AddWXWorker.RequestBody) {
    return request<Api.Worker.AddWXWorker.ResponseData>(
        Api.Worker.AddWXWorker.url,
        { method: Api.Worker.AddWXWorker.method, body }
    );
}

export function requestPauseAndRecoverWorker(body: Api.Worker.PauseAndRecoverWorker.RequestBody) {
    return request<Api.Worker.PauseAndRecoverWorker.ResponseData>(
        Api.Worker.PauseAndRecoverWorker.url,
        { method: Api.Worker.PauseAndRecoverWorker.method, body }
    );
}

export function requestRemoveWorker(body: Api.Worker.RemoveWorker.RequestBody) {
    return request<Api.Worker.RemoveWorker.ResponseData>(
        Api.Worker.RemoveWorker.url,
        { method: Api.Worker.RemoveWorker.method, body }
    );
}

export function requestUpdateWorker(body: Api.Worker.UpdateWorker.RequestBody) {
    return request<Api.Worker.UpdateWorker.ResponseData>(
        Api.Worker.UpdateWorker.url,
        { method: Api.Worker.UpdateWorker.method, body }
    );
}

export function requestAddTask(body: Api.Worker.AddTask.RequestBody) {
    return request<Api.Worker.AddTask.ResponseData>(
        Api.Worker.AddTask.url,
        { method: Api.Worker.AddTask.method, body }
    );
}

export function requestRemoveTask(body: Api.Worker.RemoveTask.RequestBody) {
    return request<Api.Worker.RemoveTask.ResponseData>(
        Api.Worker.RemoveTask.url,
        { method: Api.Worker.RemoveTask.method, body }
    );
}

export function requestAbortTask(body: Api.Worker.AbortTask.RequestBody) {
    return request<Api.Worker.AbortTask.ResponseData>(
        Api.Worker.AbortTask.url,
        { method: Api.Worker.AbortTask.method, body }
    );
}

export function requestResetTaskStatus(body: Api.Worker.ResetTaskStatus.RequestBody) {
    return request<Api.Worker.ResetTaskStatus.ResponseData>(
        Api.Worker.ResetTaskStatus.url,
        { method: Api.Worker.ResetTaskStatus.method, body }
    );
}

export function requestSetWXCategory(body: Api.Worker.SetWXCategory.RequestBody) {
    return request<Api.Worker.SetWXCategory.ResponseData>(
        Api.Worker.SetWXCategory.url,
        { method: Api.Worker.SetWXCategory.method, body }
    );
}
