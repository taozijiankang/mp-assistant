import { BaseWorkerInfo, BaseWorkerOptions } from "../BaseWorker.js";
import { WorkerType } from "../const.js";

export interface WXWorkerOptions extends BaseWorkerOptions {
    /** 已标记的小程序 appId 列表 */
    markWXAppIds?: string[];
}

export interface WXWorkerInfo extends BaseWorkerInfo {
    type: WorkerType.WX;
    options: WXWorkerOptions;
}
