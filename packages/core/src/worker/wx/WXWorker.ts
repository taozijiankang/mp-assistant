import { WorkerType } from "@mp-assistant/common/dist/work/const.js";
import { BaseWorker } from "../BaseWorker.js";
import { BaseWorkerInfo, BaseWorkerOptions } from "@mp-assistant/common/dist/work/BaseWorker.js";

export class WXWorker extends BaseWorker<BaseWorkerOptions, BaseWorkerInfo> {
    readonly type = WorkerType.WX;
}