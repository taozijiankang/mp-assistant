import { TaskStatus, WXTaskType } from "./const.js";

export interface BaseTaskOptions {
    name: string;
}

export interface BaseTaskInfo {
    key: string;
    type: WXTaskType;
    status: TaskStatus;
    createdTime: string;
    options: BaseTaskOptions;
}