import { BrowserContext } from "playwright";
import { BaseWXTask } from "./BaseWXTask.js";
import { TaskExecResult, TaskStatus, TaskType, WXTaskN } from "@mp-assistant/common/dist/work/task/index.js";
import { WXMP_VERSION_MANAGEMENT_URL } from "../../../constant/wx.js";

/**
 * 检查小程序版本任务
 * 进入小程序版本管理页面，获取各个版本的信息
 */
export class InspectVersionTask extends BaseWXTask {
    readonly type = TaskType.WX_INSPECT_VERSION;

    protected async _executor(browserContent: BrowserContext): Promise<TaskExecResult<WXTaskN.GetVersionListResult>> {
        const page = await this._switchMP(browserContent);
        try {
            await page.goto(`${WXMP_VERSION_MANAGEMENT_URL}${new URL(page.url()).search}`);

            const currentVersionData = await this._getVersionList(page);

            return {
                status: TaskStatus.COMPLETED,
                data: currentVersionData,
                endTimestamp: Date.now(),
            }
        } catch (error) {
            throw new Error('版本管理页面加载失败');
        } finally {
            page.close();
        }
    }
}