import { BaseWorkerInfo, BaseWorkerOptions } from "../BaseWorker.js";
import { WorkerType } from "../const.js";
import { WXMPItem } from "../../types/wx.js";

export interface WXWorkerOptions extends BaseWorkerOptions {
}

export interface WXWorkerInfo extends BaseWorkerInfo {
    type: WorkerType.WX;
    options: WXWorkerOptions;
    /** 当前运行中的登录任务的二维码，聚合自 taskList */
    loginQRCode?: string;
    /** 最近完成的登录任务的小程序列表 */
    wxaList?: WXMPItem[];
}
