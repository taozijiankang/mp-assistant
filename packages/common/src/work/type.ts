import { WXMPItem } from "../types/wx.js";
import { WorkerType } from "./index.js";
import { BaseTaskInfo } from "./task/type.js";

export interface BaseWorkerParams {
    key?: string;
    name?: string;
}

export interface BaseWorkInfo {
    name: string;
    type: WorkerType;
    key: string;
    taskList: BaseTaskInfo[];
}

export interface WXWorkInfo extends BaseWorkInfo {
    type: WorkerType.WX;
    isLogin: boolean;
    loginQRCodeURL: string;
    wxaList: WXMPItem[];
}
