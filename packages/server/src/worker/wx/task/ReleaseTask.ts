import { BaseTask } from "../../BaseTask.js";
import { BrowserContext } from "playwright";
import { TaskExecResultType, WXTaskType } from "mp-assistant-common/dist/constant/enum.js";


/**
 * 发布小程序任务
 * 进入小程序版本管理页面，选择要发布的小程序版本，并进行发布
 */
export class ReleaseTask extends BaseTask {
    readonly type = WXTaskType.PUBLISH;

    async exec(browserContent: BrowserContext): Promise<TaskExecResultType> {
        console.log('发布任务开始执行');
        return TaskExecResultType.COMPLETED;
    }
}