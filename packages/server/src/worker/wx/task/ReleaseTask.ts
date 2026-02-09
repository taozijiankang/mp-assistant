import { BaseTask } from "../../BaseTask.js";
import { BrowserContext } from "playwright";
import { WXTaskType } from "mp-assistant-common/dist/constant/enum.js";

/**
 * 发布任务
 */
export class ReleaseTask extends BaseTask {
    readonly type = WXTaskType.PUBLISH;

    async startExec(browserContent: BrowserContext): Promise<void> {
        throw new Error("Method not implemented.");
    }
    async stopExec(): Promise<void> {
        throw new Error("Method not implemented.");
    }
}