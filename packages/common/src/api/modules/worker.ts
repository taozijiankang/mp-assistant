import { BaseTaskInfo } from "../../work/BaseTask.js";
import { BaseWorkerInfo, BaseWorkerOptions, WorkerListItem } from "../../work/BaseWorker.js";
import { WXWorkerDetailInfo, WXWorkerInfo, WorkerOverviewItem } from "../../work/wx/WXWorker.js";
import { WXTaskInfo } from "../../work/wx/WXTask.js";
import { APIErrorRes, APISuccessRes } from "../type.js";

export namespace WorkerApi {
    /**
     * 获取所有 Worker 列表项（精简，仅供列表页展示）
     */
    export namespace GetWorkerList {
        export const url = '/worker/list';
        export const method = 'GET';

        export type ResponseData = WorkerListItem[];
        export type SuccessResponse = APISuccessRes<ResponseData>;
        export type Response = SuccessResponse | APIErrorRes;
    }

    /**
     * 获取单个 Worker 详情（任务为摘要，版本信息聚合）
     */
    export namespace GetWorkerDetail {
        export const url = '/worker/detail';
        export const method = 'GET';

        export type RequestQuery = {
            key: string;
        };

        export type ResponseData = WXWorkerDetailInfo;
        export type SuccessResponse = APISuccessRes<ResponseData>;
        export type Response = SuccessResponse | APIErrorRes;
    }

    /**
     * 获取单个任务详情（完整信息）
     */
    export namespace GetTaskDetail {
        export const url = '/worker/task';
        export const method = 'GET';

        export type RequestQuery = {
            key: string;
            taskKey: string;
        };

        export type ResponseData = WXTaskInfo;
        export type SuccessResponse = APISuccessRes<ResponseData>;
        export type Response = SuccessResponse | APIErrorRes;
    }

    /**
     * 获取总览页矩阵（每个 worker 下的小程序列表）
     */
    export namespace GetWorkerOverview {
        export const url = '/worker/overview';
        export const method = 'GET';

        export type ResponseData = WorkerOverviewItem[];
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

        export type RequestBody = {
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

        export type RequestBody = {
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

        export type RequestBody = {
            key: string;
            name?: string;
            weight?: number;
        };

        export type ResponseData = BaseWorkerInfo;
        export type SuccessResponse = APISuccessRes<ResponseData>;
        export type Response = SuccessResponse | APIErrorRes;
    }

    /**
     * 添加任务
     */
    export namespace AddTask {
        export const url = '/worker/addTask';
        export const method = 'POST';

        export type RequestBody = {
            key: string;
            type: string;
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

        export type RequestBody = {
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

        export type RequestBody = {
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

        export type RequestBody = {
            key: string;
            taskKey: string;
        };

        export type ResponseData = BaseTaskInfo;
        export type SuccessResponse = APISuccessRes<ResponseData>;
        export type Response = SuccessResponse | APIErrorRes;
    }

    /**
     * 设置任务定时开关
     */
    export namespace SetTaskScheduled {
        export const url = '/worker/setTaskScheduled';
        export const method = 'POST';

        export type RequestBody = {
            key: string;
            taskKey: string;
            scheduled: boolean;
        };

        export type ResponseData = BaseTaskInfo;
        export type SuccessResponse = APISuccessRes<ResponseData>;
        export type Response = SuccessResponse | APIErrorRes;
    }
}
