import { WXTaskType } from "@mp-assistant/common/dist/work/const.js";
import { WXTask } from "../../WXTask.js";
import { WXAuditTaskInfo, WXAuditTaskOptions } from "@mp-assistant/common/dist/work/index.js";
import { WXAuditExecutor } from "./executor.js";

export class WXAuditTask extends WXTask<WXAuditTaskOptions, WXAuditTaskInfo> {
    readonly type = WXTaskType.WX_AUDIT;

    createExecutor(): WXAuditExecutor {
        return new WXAuditExecutor(this.options);
    }
}
