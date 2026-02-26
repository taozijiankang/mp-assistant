import { BrowserContext, Locator, Page } from "playwright";
import { BaseWXTask } from "./BaseWXTask.js";
import { TaskStatus, TaskType } from "mp-assistant-common/dist/work/task/index.js";
import { TaskExecResult, WXTask } from "mp-assistant-common/dist/work/task/type.js";
import { WXMP_VERSION_MANAGEMENT_URL } from "../../../constant/wx.js";

/**
 * 检查小程序版本任务
 * 进入小程序版本管理页面，获取各个版本的信息
 */
export class InspectVersionTask extends BaseWXTask {
    readonly type = TaskType.WX_INSPECT_VERSION;

    protected async _executor(browserContent: BrowserContext): Promise<TaskExecResult<WXTask.GetVersionListResult>> {
        const page = await this._switchMP(browserContent);
        try {
            await page.goto(`${WXMP_VERSION_MANAGEMENT_URL}${new URL(page.url()).search}`);

            const currentVersionData = await this._getVersionList(page)

            /**
             * 获取版本管理页面中的版本列表
             */
            console.log('获取版本管理页面中的版本列表');
            return {
                status: TaskStatus.COMPLETED,
                data: currentVersionData,
            }
        } catch (error) {
            throw new Error('版本管理页面加载失败');
        }
    }
}