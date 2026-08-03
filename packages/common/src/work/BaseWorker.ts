import { WorkerStatus, WorkerType } from "./const.js";

export interface BaseWorkerOptions {
    name: string;
    /** 同步任务数量 */
    syncTaskNum: number;
    /** 权重 */
    weight?: number;
}

export interface BaseWorkerInfo {
    key: string;
    type: WorkerType;
    status: WorkerStatus;
    createdTime: string;
    options: BaseWorkerOptions;
}