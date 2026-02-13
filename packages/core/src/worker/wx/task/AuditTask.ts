import { BrowserContext } from "playwright";
import { WXTask } from "./WXTask.js";
import { TaskType } from "mp-assistant-common/dist/work/task/index.js";
import { TaskExecResult } from "mp-assistant-common/dist/work/task/type.js";

/**
 * 审核小程序任务
 * 进入小程序版本管理页面，选择要审核的小程序版本，并进行审核
 */
export class AuditTask extends WXTask {
    readonly type = TaskType.WX_AUDIT;

    protected _executor(browserContent: BrowserContext): Promise<TaskExecResult> {
        throw new Error("Method not implemented.");
    }
}