import { BaseTask } from "../../BaseTask.js";
import { BrowserContext } from "playwright";
import { TaskExecResultType, WXTaskType } from "mp-assistant-common/dist/constant/enum.js";


/**
 * 发布任务
 */
export class ReleaseTask extends BaseTask {
    readonly type = WXTaskType.PUBLISH;

    async exec(browserContent: BrowserContext): Promise<TaskExecResultType> {
        console.log('发布任务开始执行');
        return TaskExecResultType.COMPLETED;
    }
}