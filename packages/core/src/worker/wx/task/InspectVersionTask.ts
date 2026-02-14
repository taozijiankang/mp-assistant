import { BrowserContext } from "playwright";
import { WXTask } from "./WXTask.js";
import { TaskStatus, TaskType } from "mp-assistant-common/dist/work/task/index.js";
import { TaskExecResult } from "mp-assistant-common/dist/work/task/type.js";
import { WXMP_VERSION_MANAGEMENT_URL } from "../../../constant/wx.js";

/**
 * 检查小程序版本任务
 * 进入小程序版本管理页面，获取各个版本的信息
 */
export class InspectVersionTask extends WXTask {
    readonly type = TaskType.WX_INSPECT_VERSION;

    protected async _executor(browserContent: BrowserContext): Promise<TaskExecResult> {
        const page = await this._switchMP(browserContent);
        try {
            await page.goto(`${WXMP_VERSION_MANAGEMENT_URL}${new URL(page.url()).search}`);
            /**
             * 获取版本管理页面中的版本列表
             */
            console.log('获取版本管理页面中的版本列表');
            return {
                status: TaskStatus.COMPLETED,
            }
        } catch (error) {
            throw new Error('版本管理页面加载失败');
        }
    }
}