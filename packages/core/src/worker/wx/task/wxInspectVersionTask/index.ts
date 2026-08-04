import { WXTaskType } from "@mp-assistant/common/dist/work/const.js";
import { WXTask } from "../../WXTask.js";
import { WXInspectVersionTaskInfo, WXInspectVersionTaskOptions } from "@mp-assistant/common/dist/work/index.js";
import { WXInspectVersionExecutor } from "./executor.js";
import { BrowserContext } from "playwright";

export class WXInspectVersionTask extends WXTask<WXInspectVersionTaskOptions, WXInspectVersionTaskInfo> {
    readonly type = WXTaskType.WX_INSPECT_VERSION;

    execute(context: BrowserContext) {
        new WXInspectVersionExecutor(this.options, context).execute();
    }
}
