import { WXMPItem } from "../types/wx.js";
import { WSMessage } from "../ws/message.js";
import { WorkerType } from "./index.js";
import { BaseTaskInfo } from "./task/type.js";

export interface BaseWorkerOptions {
    key?: string;
    name?: string;
    wsMessageEventHandler: WSMessage.Event;
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
