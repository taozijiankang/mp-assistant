import { BrowserContext } from "playwright";
import { BaseWXTask } from "./BaseWXTask.js";
import { TaskExecResult, TaskType } from "mp-assistant-common/dist/work/task/index.js";

/**
 * 发布小程序任务
 * 进入小程序版本管理页面，选择要发布的小程序版本，并进行发布
 */
export class ReleaseTask extends BaseWXTask {
    readonly type = TaskType.WX_PUBLISH;

    protected async _executor(browserContent: BrowserContext): Promise<TaskExecResult> {
        await this._switchMP(browserContent);

        try {

        } catch (error) {

        }
        throw new Error("Method not implemented.");
    }
}