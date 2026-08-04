import { BaseTaskInfo } from "../../work/BaseTask.js";
import { BaseWorkerInfo, BaseWorkerOptions } from "../../work/BaseWorker.js";
import { WorkerType, WXTaskType } from "../../work/const.js";
import { WXWorkerInfo } from "../../work/wx/WXWorker.js";
import { APIErrorRes, APISuccessRes } from "../type.js";

export namespace WorkerApi {
    /**
     * 获取所有 Worker 信息
     */
    export namespace GetWorkerList {
        export const url = '/worker/list';
        export const method = 'GET';

        export type ResponseData = BaseWorkerInfo[];
        export type SuccessResponse = APISuccessRes<ResponseData>;
        export type Response = SuccessResponse | APIErrorRes;
    }

    /**
     * 获取指定 Worker 信息
     */
    export namespace GetWorkerDetail {
        export const url = '/worker/detail';
        export const method = 'GET';

        export type RequestQuery = {
            key: string;
        };

        export type ResponseData = BaseWorkerInfo;
        export type SuccessResponse = APISuccessRes<ResponseData>;
        export type Response = SuccessResponse | APIErrorRes;
    }

    /**
     * 添加 Worker
     */
    export namespace AddWXWorker {
        export const url = '/worker/addWXWorker';
        export const method = 'POST';

        export type RequestBody = BaseWorkerOptions;

        export type ResponseData = WXWorkerInfo;
        export type SuccessResponse = APISuccessRes<ResponseData>;
        export type Response = SuccessResponse | APIErrorRes;
    }

    /**
     * 暂停 Worker
     */
    export namespace PauseAndRecoverWorker {
        export const url = '/worker/pauseAndRecover';
        export const method = 'POST';

        export type RequestQuery = {
            key: string;
            suspend: boolean;
        };

        export type ResponseData = void;
        export type SuccessResponse = APISuccessRes<ResponseData>;
        export type Response = SuccessResponse | APIErrorRes;
    }

    /**
     * 删除 Worker
     */
    export namespace RemoveWorker {
        export const url = '/worker/remove';
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
        export const url = '/worker/update';
        export const method = 'PUT';

        export type RequestQuery = {
            key: string;
        };
        export type RequestBody = {
            name?: string;
            weight?: number;
        };

        export type ResponseData = BaseWorkerInfo;
        export type SuccessResponse = APISuccessRes<ResponseData>;
        export type Response = SuccessResponse | APIErrorRes;
    }

    /**
     * 标记小程序
     */
    export namespace MarkWXAppId {
        export const url = '/worker/markWXAppId';
        export const method = 'POST';

        export type RequestQuery = {
            key: string;
        }

        export type RequestBody = {
            appId: string;
            mark: boolean;
        };

        export type ResponseData = void;
        export type SuccessResponse = APISuccessRes<ResponseData>;
        export type Response = SuccessResponse | APIErrorRes;
    }

    /**
     * 清空该 Worker 下所有小程序标记
     */
    export namespace ClearAllMarkWXAppIds {
        export const url = '/worker/clearAllMarkWXAppIds';
        export const method = 'POST';

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
        export const url = '/worker/addTask';
        export const method = 'POST';

        export type RequestQuery = {
            key: string;
        };
        export type RequestBody = {
            type: WXTaskType;
            options: any;
        };

        export type ResponseData = BaseTaskInfo;
        export type SuccessResponse = APISuccessRes<ResponseData>;
        export type Response = SuccessResponse | APIErrorRes;
    }

    /**
     * 删除任务
     */
    export namespace RemoveTask {
        export const url = '/worker/removeTask';
        export const method = 'DELETE';

        export type RequestQuery = {
            key: string;
            taskKey: string;
        };

        export type ResponseData = BaseTaskInfo;
        export type SuccessResponse = APISuccessRes<ResponseData>;
        export type Response = SuccessResponse | APIErrorRes;
    }


    /**
     * 获取任务信息
     */
    export namespace TaskDetail {
        export const url = '/worker/taskDetail';
        export const method = 'GET';

        export type RequestQuery = {
            key: string;
            taskKey: string;
        };

        export type ResponseData = BaseTaskInfo;
        export type SuccessResponse = APISuccessRes<ResponseData>;
        export type Response = SuccessResponse | APIErrorRes;
    }

    /**
     * 终止任务
     */
    export namespace AbortTask {
        export const url = '/worker/abortTask';
        export const method = 'POST';

        export type RequestQuery = {
            key: string;
            taskKey: string;
        };

        export type ResponseData = BaseTaskInfo;
        export type SuccessResponse = APISuccessRes<ResponseData>;
        export type Response = SuccessResponse | APIErrorRes;
    }

    /**
     * 重置任务状态
     */
    export namespace ResetTaskStatus {
        export const url = '/worker/resetTaskStatus';
        export const method = 'POST';

        export type RequestQuery = {
            key: string;
            taskKey: string;
        };

        export type ResponseData = BaseTaskInfo;
        export type SuccessResponse = APISuccessRes<ResponseData>;
        export type Response = SuccessResponse | APIErrorRes;
    }
}