import { BaseTask } from "../../BaseTask.js";
import { BrowserContext } from "playwright";

/**
 * 切换小程序任务
 */
export class SwitchMPTask extends BaseTask {
    protected async startExec(browserContent: BrowserContext): Promise<void> {
        throw new Error("Method not implemented.");
    }
    protected async stopExec(): Promise<void> {
        throw new Error("Method not implemented.");
    }
}