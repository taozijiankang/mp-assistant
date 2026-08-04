import { WXTaskType } from "@mp-assistant/common/dist/work/const.js";
import { WXTask } from "../../WXTask.js";
import { WXLoginTaskInfo, WXLoginTaskOptions } from "@mp-assistant/common/dist/work/index.js";
import { WXLoginExecutor } from "./executor.js";
import { BrowserContext } from "playwright";

export class WXLoginTask extends WXTask<WXLoginTaskOptions, WXLoginTaskInfo> {
    readonly type = WXTaskType.WX_LOGIN;

    execute(context: BrowserContext) {
        new WXLoginExecutor(this.options, context).execute();
    }
}
