import { WXMPItem } from "../types/wx.js";
import { WorkerType } from "./index.js";
import { BaseTaskInfo } from "./task/type.js";

export interface BaseWorkInfo {
    name: string;
    type: WorkerType;
    key: string;
    taskList: BaseTaskInfo[];
    completedTaskList: BaseTaskInfo[];
}

export interface WXWorkInfo extends BaseWorkInfo {
    type: WorkerType.WX;
    isLogin: boolean;
    loginQRCodeURL: string;
    wxaList: WXMPItem[];
}
