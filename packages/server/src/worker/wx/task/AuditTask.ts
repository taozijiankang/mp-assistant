import { BaseTask } from "../../BaseTask.js";
import { BrowserContext } from "playwright";

/**
 * 审核任务
 */
export class AuditTask extends BaseTask {
    protected async startExec(browserContent: BrowserContext): Promise<void> {
        throw new Error("Method not implemented.");
    }
    protected async stopExec(): Promise<void> {
        throw new Error("Method not implemented.");
    }
}