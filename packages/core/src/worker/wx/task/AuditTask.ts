import { BrowserContext } from "playwright";
import { BaseWXTask } from "./BaseWXTask.js";
import { TaskExecResult, TaskStatus, TaskType, WXTaskN } from "mp-assistant-common/dist/work/task/index.js";
import { WXReviewStatus } from "mp-assistant-common/dist/types/wx.js";

/**
 * 审核小程序任务
 * 进入小程序版本管理页面，选择要审核的小程序版本，并进行审核
 */
export class AuditTask extends BaseWXTask {
    readonly options: WXTaskN.AuditTaskOptions;

    constructor(options: WXTaskN.AuditTaskOptions) {
        super(options);

        this.options = options;
    }

    protected async _executor(browserContent: BrowserContext): Promise<TaskExecResult> {
        this._addRunningReport({
            title: '执行审核任务',
            description: '审核任务逻辑暂未实现',
            timestamp: Date.now(),
            images: [],
        });

        const page = await this._switchMP(browserContent);
        const currentVersionData = await this._getVersionList(page)
        const developVersionList = currentVersionData[WXTaskN.VersionType.DEVELOP]

        return {
            status: TaskStatus.FAILED,
        };
    }
}