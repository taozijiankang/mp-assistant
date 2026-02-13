import { WXMPItem } from "../types/wx.js";
import { WorkerType } from "./index.js";
import { BaseTaskInfo } from "./task/type.js";

export interface BaseWorkInfo {
    name: string;
    type: WorkerType;
    key: string;
    taskList: BaseTaskInfo[];
    currentRunningTaskKey: string;
    succeedTaskList: BaseTaskInfo[];
}

export interface WXWorkInfo extends BaseWorkInfo {
    loginQRCodeURL: string;
    wxaList: WXMPItem[];
}
