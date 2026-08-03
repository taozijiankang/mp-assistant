import { BaseWorkerInfo, BaseWorkerOptions } from "../BaseWorker.js";
import { WorkerType } from "../const.js";

export interface WXWorkerOptions extends BaseWorkerOptions { }

export interface WXWorkerInfo extends BaseWorkerInfo {
    type: WorkerType.WX;
    options: WXWorkerOptions;
}
