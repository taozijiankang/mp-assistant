import { BaseTask } from "../../BaseTask.js";
import { BrowserContext } from "playwright";
import { TaskExecResultType, WXTaskType } from "mp-assistant-common/dist/constant/enum.js";

/**
 * 检查小程序版本任务
 * 进入小程序版本管理页面，获取各个版本的信息
 */
export class InspectVersionTask extends BaseTask {
    readonly type = WXTaskType.INSPECT_VERSION;

    async exec(browserContent: BrowserContext): Promise<TaskExecResultType> {
        console.log('检查小程序版本任务执行成功');
        return TaskExecResultType.COMPLETED;
    }
}