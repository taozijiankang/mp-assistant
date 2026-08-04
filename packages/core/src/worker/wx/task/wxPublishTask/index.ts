import { WXTaskType } from "@mp-assistant/common/dist/work/const.js";
import { WXTask } from "../../WXTask.js";
import { WXPublishTaskInfo, WXPublishTaskOptions } from "@mp-assistant/common/dist/work/index.js";
import { WXPublishExecutor } from "./executor.js";
import { BrowserContext } from "playwright";

export class WXPublishTask extends WXTask<WXPublishTaskOptions, WXPublishTaskInfo> {
    readonly type = WXTaskType.WX_PUBLISH;

    execute(context: BrowserContext) {
        new WXPublishExecutor(this.options, context).execute();
    }
}
