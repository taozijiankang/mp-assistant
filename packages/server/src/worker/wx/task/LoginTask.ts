import { BaseTask } from "../../BaseTask.js";
import { BrowserContext } from "playwright";

/**
 * 登录任务
 */
export class LoginTask extends BaseTask {
    protected async startExec(browserContent: BrowserContext): Promise<void> {
        throw new Error("Method not implemented.");
    }
    protected async stopExec(): Promise<void> {
        throw new Error("Method not implemented.");
    }
}