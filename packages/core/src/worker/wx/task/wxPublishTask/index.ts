import { WXTaskType } from "@mp-assistant/common/dist/work/const.js";
import { WXTask } from "../../WXTask.js";
import { WXPublishTaskInfo, WXPublishTaskOptions } from "@mp-assistant/common/dist/work/index.js";
import { BrowserContext } from "playwright";

export class WXPublishTask extends WXTask<WXPublishTaskOptions, WXPublishTaskInfo> {
    readonly type = WXTaskType.WX_PUBLISH;

    execute(browserContext: BrowserContext): Promise<void> {
        // TODO: 实现发布流程
        return Promise.resolve();
    }
}
