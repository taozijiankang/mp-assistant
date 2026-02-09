import { BaseTask } from "../../BaseTask.js";
import { BrowserContext } from "playwright";
import { TaskExecStatusType, WXTaskType } from "mp-assistant-common/dist/constant/enum.js";

/**
 * 审核任务
 */
export class AuditTask extends BaseTask {
    readonly type = WXTaskType.AUDIT;

    async startExec(browserContent: BrowserContext): Promise<void> {
        if (this.getExecStatus() === TaskExecStatusType.RUNNING) {
            return;
        }
        this.setExecStatus(TaskExecStatusType.RUNNING);

        console.log('审核任务开始执行');
    }
    async stopExec(): Promise<void> {
        throw new Error("Method not implemented.");
    }
}