import { BaseTask } from "../../BaseTask.js";
import { BrowserContext } from "playwright";

/**
 * 发布任务
 */
export class ReleaseTask extends BaseTask {
    protected async startExec(browserContent: BrowserContext): Promise<void> {
        throw new Error("Method not implemented.");
    }
    protected async stopExec(): Promise<void> {
        throw new Error("Method not implemented.");
    }
}