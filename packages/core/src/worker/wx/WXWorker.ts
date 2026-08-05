import { WorkerType } from "@mp-assistant/common/dist/work/const.js";
import { BaseWorker } from "../BaseWorker.js";
import { WXWorkerInfo, WXWorkerOptions } from "@mp-assistant/common/dist/work/wx/WXWorker.js";

export class WXWorker extends BaseWorker<WXWorkerOptions, WXWorkerInfo> {
    readonly type = WorkerType.WX;
}
