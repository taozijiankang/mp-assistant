import { BaseWorkerInfo, BaseWorkerOptions } from "../BaseWorker.js";
import { WorkerType } from "../const.js";
import { WXMPItem, WXVersionCodeData } from "../../types/wx.js";
import { WXTaskInfo } from "./WXTask.js";

export type WXWorkerOptions = BaseWorkerOptions;

export interface WXWorkerWxaItem extends WXMPItem {
    /** 版本信息，聚合自检测版本任务 */
    versionData?: WXVersionCodeData;
    /** 关联的 WX 任务列表 */
    tasks?: WXTaskInfo[];
}

export interface WXWorkerInfo extends BaseWorkerInfo {
    type: WorkerType.WX;
    options: WXWorkerOptions;
    /** 当前运行中的登录任务的二维码，聚合自 taskList */
    loginQRCode?: string;
    /** 最近完成的登录任务的小程序列表 */
    wxaList?: WXWorkerWxaItem[];
}
