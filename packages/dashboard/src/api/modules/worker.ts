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

export function requestAddWorker(body: Api.Worker.AddWorker.RequestBody) {
    return request<Api.Worker.AddWorker.ResponseData>(
        Api.Worker.AddWorker.url,
        { method: Api.Worker.AddWorker.method, body }
    );
}

export function requestPauseWorker(key: string) {
    return request<Api.Worker.PauseWorker.ResponseData>(
        Api.Worker.PauseWorker.url,
        { method: Api.Worker.PauseWorker.method, query: { key } }
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

export function requestLoginWorker(key: string) {
    return request<Api.Worker.WorkerLogin.ResponseData>(
        Api.Worker.WorkerLogin.url,
        { method: Api.Worker.WorkerLogin.method, query: { key } }
    );
}

export function requestLogoutWorker(key: string) {
    return request<Api.Worker.WorkerLogout.ResponseData>(
        Api.Worker.WorkerLogout.url,
        { method: Api.Worker.WorkerLogout.method, query: { key } }
    );
}

export function requestWorkerUpdateWxaList(key: string) {
    return request<Api.Worker.WorkerUpdateWxaList.ResponseData>(
        Api.Worker.WorkerUpdateWxaList.url,
        { method: Api.Worker.WorkerUpdateWxaList.method, query: { key } }
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

