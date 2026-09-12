import { BaseTaskInfo, BaseTaskOptions, BaseTaskSummary } from "../BaseTask.js";

export interface WXTaskOptions extends BaseTaskOptions {
}

export interface WXTaskInfo extends BaseTaskInfo {
    /** 登录二维码 base64 data URL */
    loginQRCode?: string;
    /** 整体超时兜底的倒计时（剩余秒数） */
    timeoutCountdown?: number;
}

/** WX 任务摘要（精简，供 worker 详情面板使用） */
export interface WXTaskSummary extends BaseTaskSummary {
    /** 登录二维码 base64 data URL */
    loginQRCode?: string;
    /** 整体超时兜底的倒计时（剩余秒数） */
    timeoutCountdown?: number;
    /** 发布二维码 base64 data URL */
    publishQRCode?: string;
}