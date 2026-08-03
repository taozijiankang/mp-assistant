import { BaseTaskInfo, BaseTaskOptions } from "../BaseTask.js";

export interface WXTaskOptions extends BaseTaskOptions { 
    appId: string;
}

export interface WXTaskInfo extends BaseTaskInfo {
    appId: string;
}