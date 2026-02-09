import { BaseTask } from "../../BaseTask.js";
import { BrowserContext } from "playwright";
import { TaskExecStatusType, WXTaskType } from "mp-assistant-common/dist/constant/enum.js";

/**
 * 审核任务
 */
export class AuditTask extends BaseTask {
    readonly type = WXTaskType.AUDIT;

    async startExec_(browserContent: BrowserContext): Promise<void> {
        console.log('审核任务开始执行');
    }
    async resetExec_(): Promise<void> {
        console.log('审核任务重置执行');
        this.setExecStatus(TaskExecStatusType.IDLE);
    }
}