import { BaseTaskInfo, BaseTaskOptions } from "../BaseTask.js";

export interface WXTaskOptions extends BaseTaskOptions {
}

export interface WXTaskInfo extends BaseTaskInfo {
    /** 登录二维码 base64 data URL */
    loginQRCode?: string;
    /** 整体超时兜底的倒计时（剩余秒数） */
    timeoutCountdown?: number;
}