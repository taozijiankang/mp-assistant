import { ApiResponse } from "./type.js";
import { BaseWorkInfo } from "../work/type.js";
import { WorkerType } from "../work/index.js";
import { TaskType } from "../work/task/index.js";
import { BaseTaskInfo } from "../work/task/type.js";
import { WXMPItem } from "../types/wx.js";

export namespace WorkerApi {
    export namespace GetWorkerInfos {
        export const url = '/workerInfos';
        export const method = 'GET';

        export type ResponseData = BaseWorkInfo[];
        export type Response = ApiResponse<ResponseData>;
    }

    export namespace GetWorkerInfo {
        export const url = '/workerInfo/:key';
        export const method = 'GET';

        export type RequestParams = {
            key: string;
        };
        export type ResponseData = BaseWorkInfo;
        export type Response = ApiResponse<ResponseData>;
    }

    export namespace AddWorker {
        export const url = '/worker/add';
        export const method = 'POST';

        export type RequestBody = {
            type: WorkerType;
            name: string;
        };
        export type ResponseData = BaseWorkInfo;
        export type Response = ApiResponse<ResponseData>;
    }

    export namespace RemoveWorker {
        export const url = '/worker/remove/:key';
        export const method = 'DELETE';

        export type RequestParams = {
            key: string;
        };
        export type ResponseData = void;
        export type Response = ApiResponse<ResponseData>;
    }

    export namespace UpdateWorker {
        export const url = '/worker/update/:key';
        export const method = 'PUT';

        export type RequestParams = {
            key: string;
        };

        export type RequestBody = {
            name: string;
        };
        export type ResponseData = BaseWorkInfo;
        export type Response = ApiResponse<ResponseData>;
    }

    export namespace WorkerLogin {
        export const url = '/worker/login/:key';
        export const method = 'POST';

        export type RequestParams = {
            key: string;
        };
        export type ResponseData = void;
        export type Response = ApiResponse<ResponseData>;
    }

    export namespace WorkerGetWxaList {
        export const url = '/worker/getWxaList/:key';
        export const method = 'GET';
        export type RequestParams = {
            key: string;
        };
        export type ResponseData = WXMPItem[];
        export type Response = ApiResponse<ResponseData>;
    }

    export namespace AddTask {
        export const url = '/worker/addTask/:key';
        export const method = 'POST';

        export type RequestParams = {
            key: string;
        };

        export type RequestBody = {
            type: TaskType;
            params: any;
        };
        export type ResponseData = BaseWorkInfo;
        export type Response = ApiResponse<ResponseData>;
    }

    export namespace RemoveTask {
        export const url = '/worker/removeTask/:key/:taskKey';
        export const method = 'DELETE';

        export type RequestParams = {
            key: string;
            taskKey: string;
        };

        export type ResponseData = BaseWorkInfo;
        export type Response = ApiResponse<ResponseData>;
    }

    export namespace TaskInfo {
        export const url = '/worker/taskInfo/:key/:taskKey';
        export const method = 'GET';

        export type RequestParams = {
            key: string;
            taskKey: string;
        };
        export type ResponseData = BaseTaskInfo;
        export type Response = ApiResponse<ResponseData>;
    }
}