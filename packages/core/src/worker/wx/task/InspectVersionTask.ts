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

    protected _complete(status: TaskStatus.COMPLETED | TaskStatus.FAILED, result: TaskExecResult<WXTaskN.GetVersionListResult>) {
        super._complete(status, result);
    }

    protected async _start(browserContent: BrowserContext) {
        const page = await this._switchMP(browserContent);
        try {
            await page.goto(`${WXMP_VERSION_MANAGEMENT_URL}${new URL(page.url()).search}`);

            const currentVersionData = await this._getVersionList(page);

            this._complete(TaskStatus.COMPLETED, {
                data: currentVersionData,
            });
        } catch (error) {
            throw new Error('版本管理页面加载失败');
        } finally {
            page.close();
        }
    }
}