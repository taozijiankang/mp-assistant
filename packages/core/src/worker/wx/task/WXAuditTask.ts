import { WXTaskType } from "@mp-assistant/common/dist/work/const.js";
import { WXTask } from "../WXTask.js";

export class WXAuditTask extends WXTask {
    readonly type = WXTaskType.WX_AUDIT;
}