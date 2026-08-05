import { BaseTaskInfo, BaseTaskOptions } from "../BaseTask.js";

export interface WXTaskOptions extends BaseTaskOptions {
}

export interface WXTaskInfo extends BaseTaskInfo {
    /** 登录二维码 base64 data URL */
    loginQRCode?: string;
    /** 是否已登录 */
    isLogin?: boolean;
}