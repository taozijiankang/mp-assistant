import { WXTaskType } from "./const.js";

export interface BaseTaskOptions {
    name: string;
}

export interface BaseTaskInfo {
    key: string;
    type: WXTaskType;
    createdTime: string;
    options: BaseTaskOptions;
}