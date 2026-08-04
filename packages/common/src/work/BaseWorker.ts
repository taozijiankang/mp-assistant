import { WorkerStatus, WorkerType } from "./const.js";
import { BaseTaskInfo } from "./BaseTask.js";

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
    taskList: BaseTaskInfo[];
}

export interface WorkerEvent {
    /** 详情改变 */
    detailChange: BaseWorkerInfo;
}