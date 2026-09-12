import { TaskStatus, WorkerType } from "@mp-assistant/common/dist/work/const.js";
import { BaseWorker } from "../BaseWorker.js";
import { WXWorkerInfo, WXWorkerOptions, WXWorkerWxaItem, WXWorkerDetailInfo, WorkerOverviewItem } from "@mp-assistant/common/dist/work/wx/WXWorker.js";
import { WXTaskSummary } from "@mp-assistant/common/dist/work/wx/WXTask.js";
import { BaseTaskInfo } from "@mp-assistant/common/dist/work/BaseTask.js";
import { isWXLoginTaskInfo, isWXInspectVersionTaskInfo, isWXAuditTaskInfo, isWXTaskInfo, isWXPublishTaskInfo } from "@mp-assistant/common/dist/work/index.js";
import type { WXVersionCodeData } from "@mp-assistant/common/dist/types/wx.js";

export class WXWorker extends BaseWorker<WXWorkerOptions, WXWorkerInfo> {
    readonly type = WorkerType.WX;

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

    /** 获取最近完成的登录任务的小程序列表，并聚合版本信息与任务摘要 */
    private getWxaList(): WXWorkerWxaItem[] {
        const taskList = super.info().taskList;

        // 获取原始小程序列表
        let wxaLis: WXWorkerWxaItem[] = [];
        for (const task of taskList) {
            if (task.status === TaskStatus.COMPLETED && isWXLoginTaskInfo(task) && task.wxaList) {
                wxaLis = task.wxaList as WXWorkerWxaItem[];
            }
        }
        if (!wxaLis.length) return [];

        // 按创建时间升序，最新的任务最后遍历，Map.set 覆盖后取到最新版本
        taskList.sort((a, b) => a.createdTime.localeCompare(b.createdTime));

        // 聚合版本信息
        const versionMap = new Map<string, WXVersionCodeData>();
        for (const task of taskList) {
            if (
                (isWXInspectVersionTaskInfo(task) || isWXAuditTaskInfo(task) || isWXPublishTaskInfo(task))
                && task.versionData
            ) {
                versionMap.set(task.options.appId, task.versionData);
            }
        }

        // 聚合关联任务摘要
        const taskMap = new Map<string, WXTaskSummary[]>();
        for (const task of taskList) {
            if (!isWXTaskInfo(task)) continue;
            const appId = (task.options as any).appId;
            if (!appId) continue;
            if (!taskMap.has(appId)) taskMap.set(appId, []);
            taskMap.get(appId)!.push(this.toTaskSummary(task));
        }

        const workerWxaList: WXWorkerWxaItem[] = wxaLis.map(item => ({
            ...item,
            versionData: versionMap.get(item.appid),
            tasks: taskMap.get(item.appid) ?? [],
        }));

        return workerWxaList;
    }
}
