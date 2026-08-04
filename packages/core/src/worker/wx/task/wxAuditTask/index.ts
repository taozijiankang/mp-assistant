import { WXTaskType } from "@mp-assistant/common/dist/work/const.js";
import { WXTask } from "../../WXTask.js";
import { WXAuditTaskInfo, WXAuditTaskOptions } from "@mp-assistant/common/dist/work/index.js";
import { BrowserContext } from "playwright";

export class WXAuditTask extends WXTask<WXAuditTaskOptions, WXAuditTaskInfo> {
    readonly type = WXTaskType.WX_AUDIT;

    execute(browserContext: BrowserContext): Promise<void> {
        // TODO: 实现提审流程
        return Promise.resolve();
    }
}
