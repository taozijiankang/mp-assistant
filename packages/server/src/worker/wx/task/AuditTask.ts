import { BaseTask } from "../../BaseTask.js";
import { BrowserContext } from "playwright";
import { TaskExecResultType, WXTaskType } from "mp-assistant-common/dist/constant/enum.js";

/**
 * 审核任务
 */
export class AuditTask extends BaseTask {
    readonly type = WXTaskType.AUDIT;

    async exec(browserContent: BrowserContext): Promise<TaskExecResultType> {
        console.log('审核任务执行成功');
        return TaskExecResultType.COMPLETED;
    }
}