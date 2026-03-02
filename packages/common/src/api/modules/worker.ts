import { BaseWorkInfo, WorkerType } from "../../work/index.js";
import { BaseTaskInfo, TaskType } from "../../work/task/index.js";
import { APIErrorRes, APISuccessRes } from "../type.js";

export namespace WorkerApi {
    /**
     * 获取所有 Worker 信息
     */
    export namespace GetWorkerList {
        export const url = '/worker-list';
        export const method = 'GET';

        export type ResponseData = BaseWorkInfo[];
        export type SuccessResponse = APISuccessRes<ResponseData>;
        export type Response = SuccessResponse | APIErrorRes;
    }

    /**
     * 获取指定 Worker 信息
     */
    export namespace GetWorkerDetail {
        export const url = '/worker-detail';
        export const method = 'GET';

        export type RequestQuery = {
            key: string;
        };

        export type ResponseData = BaseWorkInfo;
        export type SuccessResponse = APISuccessRes<ResponseData>;
        export type Response = SuccessResponse | APIErrorRes;
    }

    /**
     * 添加 Worker
     */
    export namespace AddWorker {
        export const url = '/worker-add';
        export const method = 'POST';

        export type RequestBody = {
            type: WorkerType;
            name: string;
        };

        export type ResponseData = BaseWorkInfo;
        export type SuccessResponse = APISuccessRes<ResponseData>;
        export type Response = SuccessResponse | APIErrorRes;
    }

    /**
     * 暂停 Worker
     */
    export namespace PauseWorker {
        export const url = '/worker-pause';
        export const method = 'POST';

        export type RequestQuery = {
            key: string;
        };

        export type ResponseData = void;
        export type SuccessResponse = APISuccessRes<ResponseData>;
        export type Response = SuccessResponse | APIErrorRes;
    }

    /**
     * 删除 Worker
     */
    export namespace RemoveWorker {
        export const url = '/worker-remove';
        export const method = 'DELETE';

        export type RequestQuery = {
            key: string;
        };

        export type ResponseData = void;
        export type SuccessResponse = APISuccessRes<ResponseData>;
        export type Response = SuccessResponse | APIErrorRes;
    }

    /**
     * 修改 Worker
     */
    export namespace UpdateWorker {
        export const url = '/worker-update';
        export const method = 'PUT';

        export type RequestQuery = {
            key: string;
        };
        export type RequestBody = {
            name: string;
        };

        export type ResponseData = BaseWorkInfo;
        export type SuccessResponse = APISuccessRes<ResponseData>;
        export type Response = SuccessResponse | APIErrorRes;
    }

    /**
     * 登录 Worker
     */
    export namespace WorkerLogin {
        export const url = '/worker-login';
        export const method = 'POST';

        export type RequestQuery = {
            key: string;
        };

        export type ResponseData = void;
        export type SuccessResponse = APISuccessRes<ResponseData>;
        export type Response = SuccessResponse | APIErrorRes;
    }

    /**
     * 登出 Worker
     */
    export namespace WorkerLogout {
        export const url = '/worker-logout';
        export const method = 'POST';

        export type RequestQuery = {
            key: string;
        };

        export type ResponseData = void;
        export type SuccessResponse = APISuccessRes<ResponseData>;
        export type Response = SuccessResponse | APIErrorRes;
    }

    /**
     * 获取 Worker 的小程序列表
     */
    export namespace WorkerUpdateWxaList {
        export const url = '/worker-updateWxaList';
        export const method = 'GET';

        export type RequestQuery = {
            key: string;
        };

        export type ResponseData = void;
        export type SuccessResponse = APISuccessRes<ResponseData>;
        export type Response = SuccessResponse | APIErrorRes;
    }

    /**
     * 添加任务
     */
    export namespace AddTask {
        export const url = '/worker-addTask';
        export const method = 'POST';

        export type RequestQuery = {
            key: string;
        };
        export type RequestBody = {
            type: TaskType;
            options: any;
        };

        export type ResponseData = BaseWorkInfo;
        export type SuccessResponse = APISuccessRes<ResponseData>;
        export type Response = SuccessResponse | APIErrorRes;
    }

    /**
     * 删除任务
     */
    export namespace RemoveTask {
        export const url = '/worker-removeTask';
        export const method = 'DELETE';

        export type RequestQuery = {
            key: string;
            taskKey: string;
        };

        export type ResponseData = BaseWorkInfo;
        export type SuccessResponse = APISuccessRes<ResponseData>;
        export type Response = SuccessResponse | APIErrorRes;
    }


    /**
     * 获取任务信息
     */
    export namespace TaskDetail {
        export const url = '/worker-taskDetail';
        export const method = 'GET';

        export type RequestQuery = {
            key: string;
            taskKey: string;
        };

        export type ResponseData = BaseTaskInfo;
        export type SuccessResponse = APISuccessRes<ResponseData>;
        export type Response = SuccessResponse | APIErrorRes;
    }
}