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
    debugPort: number;
    createdTime: string;
    options: BaseWorkerOptions;
    taskList: BaseTaskInfo[];
}

/** worker 列表项（精简，供列表页使用） */
export interface WorkerListItem {
    key: string;
    type: WorkerType;
    status: WorkerStatus;
    name: string;
    weight: number;
}

export interface WorkerEvent {
    /** 列表改变（名称/权重/状态等） */
    listChange: void;
    /** 详情改变（任务列表、二维码、小程序列表等） */
    detailChange: { workerKey: string };
    /** 单个任务详情改变 */
    taskChange: { workerKey: string; taskKey: string };
}