import { BaseWorkerInfo, BaseWorkerOptions } from "../BaseWorker.js";
import { WorkerStatus, WorkerType } from "../const.js";
import { WXMPItem, WXVersionCodeData } from "../../types/wx.js";
import { WXTaskSummary } from "./WXTask.js";

export type WXWorkerOptions = BaseWorkerOptions;

export interface WXWorkerWxaItem extends WXMPItem {
    /** 版本信息，聚合自检测版本任务 */
    versionData?: WXVersionCodeData;
    /** 关联的 WX 任务摘要列表 */
    tasks?: WXTaskSummary[];
}

export interface WXWorkerInfo extends BaseWorkerInfo {
    type: WorkerType.WX;
    options: WXWorkerOptions;
    /** 当前运行中的登录任务的二维码，聚合自 taskList */
    loginQRCode?: string;
    /** 最近完成的登录任务的小程序列表 */
    wxaList?: WXWorkerWxaItem[];
}

/** worker 详情信息（精简，供详情面板使用：任务列表为摘要） */
export interface WXWorkerDetailInfo {
    key: string;
    type: WorkerType.WX;
    status: WorkerStatus;
    createdTime: string;
    debugPort?: number;
    options: WXWorkerOptions;
    /** 当前运行中的登录任务的二维码 */
    loginQRCode?: string;
    /** 任务摘要列表 */
    taskList: WXTaskSummary[];
    /** 小程序列表（含版本信息与每 app 任务摘要） */
    wxaList?: WXWorkerWxaItem[];
}

/** 总览页矩阵项：每个 worker 下的小程序列表（仅 appid/名称/头像） */
export interface WorkerOverviewItem {
    key: string;
    name: string;
    weight: number;
    wxaList: { appid: string; app_name: string; app_headimg: string }[];
}
