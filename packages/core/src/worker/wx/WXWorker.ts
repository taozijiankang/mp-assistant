import { TaskStatus, WorkerType } from "@mp-assistant/common/dist/work/const.js";
import { BaseWorker } from "../BaseWorker.js";
import { WXWorkerInfo, WXWorkerOptions, WXWorkerWxaItem, WXWorkerDetailInfo, WorkerOverviewItem } from "@mp-assistant/common/dist/work/wx/WXWorker.js";
import { WXTaskSummary } from "@mp-assistant/common/dist/work/wx/WXTask.js";
import { BaseTaskInfo } from "@mp-assistant/common/dist/work/BaseTask.js";
import { isWXTaskInfo } from "@mp-assistant/common/dist/work/index.js";
import type { WXVersionCodeData, WXMPItem } from "@mp-assistant/common/dist/types/wx.js";

export class WXWorker extends BaseWorker<WXWorkerOptions, WXWorkerInfo> {
    readonly type = WorkerType.WX;

    /** 登录任务写回的小程序列表（含版本信息） */
    private wxaList: WXWorkerWxaItem[] = [];

    info(): WXWorkerInfo {
        return {
            ...super.info(),
            loginQRCode: this.getLoginQRCode(),
            wxaList: this.getWxaList(),
        } as WXWorkerInfo;
    }

    /** worker 详情（任务为摘要），供详情面板接口使用 */
    getDetailInfo(): WXWorkerDetailInfo {
        const base = super.info();
        return {
            key: base.key,
            type: this.type,
            status: base.status,
            createdTime: base.createdTime,
            debugPort: base.debugPort,
            options: base.options as WXWorkerOptions,
            loginQRCode: this.getLoginQRCode(),
            taskList: this.getTaskSummaryList(),
            wxaList: this.getWxaList(),
        };
    }

    /** 总览矩阵项，供总览页接口使用 */
    getOverviewInfo(): WorkerOverviewItem {
        const base = super.info();
        return {
            key: base.key,
            name: base.options.name,
            weight: base.options.weight ?? 0,
            wxaList: (this.getWxaList() ?? []).map(item => ({
                appid: item.appid,
                app_name: item.app_name,
                app_headimg: item.app_headimg,
            })),
        };
    }

    getTaskSummaryList(): WXTaskSummary[] {
        return super.info().taskList.map(task => this.toTaskSummary(task));
    }

    /** 将完整任务信息精简为摘要 */
    private toTaskSummary(task: BaseTaskInfo): WXTaskSummary {
        const reports = task.reports ?? [];
        return {
            key: task.key,
            type: task.type,
            status: task.status,
            createdTime: task.createdTime,
            completedMessage: task.completedMessage,
            completedTime: task.completedTime,
            runCount: task.runCount,
            options: task.options,
            loginQRCode: (task as any).loginQRCode,
            timeoutCountdown: (task as any).timeoutCountdown,
            publishQRCode: (task as any).publishQRCode,
            lastReport: reports[reports.length - 1],
        };
    }

    /** 从运行中的登录任务获取二维码（未登录且有码时返回） */
    private getLoginQRCode(): string | undefined {
        for (const task of super.info().taskList) {
            if (task.status === TaskStatus.RUNNING && isWXTaskInfo(task) && task.loginQRCode) {
                return task.loginQRCode;
            }
        }
    }

    /** 返回 worker 自身持有的小程序列表，仅补算每 app 的任务摘要 */
    private getWxaList(): WXWorkerWxaItem[] {
        const taskList = super.info().taskList;

        // 聚合关联任务摘要
        const taskMap = new Map<string, WXTaskSummary[]>();
        for (const task of taskList) {
            if (!isWXTaskInfo(task)) continue;
            const appId = (task.options as any).appId;
            if (!appId) continue;
            if (!taskMap.has(appId)) taskMap.set(appId, []);
            taskMap.get(appId)!.push(this.toTaskSummary(task));
        }

        return this.wxaList.map(item => ({
            ...item,
            tasks: taskMap.get(item.appid) ?? [],
        }));
    }

    /** 登录任务上报的小程序列表写回；按 appid 保留已有 versionData */
    setWxaList(list: WXMPItem[]): void {
        const prev = new Map(this.wxaList.map(item => [item.appid, item.versionData]));
        this.wxaList = list.map(item => ({
            ...item,
            versionData: prev.get(item.appid),
        }));
    }

    /** 版本类任务上报的版本信息写回；列表外的 app 忽略 */
    setVersionData(appId: string, versionData: WXVersionCodeData): void {
        const item = this.wxaList.find(i => i.appid === appId);
        if (item) item.versionData = versionData;
    }
}
