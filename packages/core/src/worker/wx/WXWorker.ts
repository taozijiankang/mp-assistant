import { WorkerType } from "@mp-assistant/common/dist/work/const.js";
import { BaseWorker } from "../BaseWorker.js";
import { WXWorkerInfo, WXWorkerOptions } from "@mp-assistant/common/dist/work/wx/WXWorker.js";

export class WXWorker extends BaseWorker<WXWorkerOptions, WXWorkerInfo> {
    readonly type = WorkerType.WX;

    markAppId(appId: string, mark: boolean): void {
        if (!this.options.markWXAppIds) {
            this.options.markWXAppIds = [];
        }
        if (mark) {
            if (this.options.markWXAppIds.includes(appId)) {
                return;
            }
            this.options.markWXAppIds.push(appId);
        } else {
            if (!this.options.markWXAppIds.includes(appId)) {
                return;
            }
            this.options.markWXAppIds = this.options.markWXAppIds.filter(id => id !== appId);
        }
    }

    clearAllMarks(): void {
        this.options.markWXAppIds = [];
    }
}
