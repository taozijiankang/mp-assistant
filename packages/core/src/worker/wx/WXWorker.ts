import { TaskStatus, WorkerType } from "@mp-assistant/common/dist/work/const.js";
import { BaseWorker } from "../BaseWorker.js";
import { WXWorkerInfo, WXWorkerOptions, WXWorkerWxaItem } from "@mp-assistant/common/dist/work/wx/WXWorker.js";
import { isWXLoginTaskInfo, isWXInspectVersionTaskInfo, isWXTaskInfo } from "@mp-assistant/common/dist/work/index.js";
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

    /** 设置小程序分组 */
    setCategory(categories: WXWorkerOptions['categories']) {
        this.options.categories = categories;
        this.changeDetail();
    }

    /** 从运行中的登录任务获取二维码（未登录且有码时返回） */
    private getLoginQRCode(): string | undefined {
        for (const task of super.info().taskList) {
            if (task.status === TaskStatus.RUNNING && isWXTaskInfo(task) && task.loginQRCode) {
                return task.loginQRCode;
            }
        }
    }

    /** 获取最近完成的登录任务的小程序列表，并聚合版本信息 */
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

        // 聚合版本信息
        const versionMap = new Map<string, WXVersionCodeData>();
        for (const task of taskList) {
            if (task.status === TaskStatus.COMPLETED && isWXInspectVersionTaskInfo(task) && task.versionData) {
                versionMap.set(task.options.appId, task.versionData);
            }
        }

        // 聚合关联任务
        const taskMap = new Map<string, typeof taskList>();
        for (const task of taskList) {
            if (!isWXTaskInfo(task)) continue;
            const appId = (task.options as any).appId;
            if (!appId) continue;
            if (!taskMap.has(appId)) taskMap.set(appId, []);
            taskMap.get(appId)!.push(task);
        }

        const workerWxaList: WXWorkerWxaItem[] = wxaLis.map(item => ({
            ...item,
            versionData: versionMap.get(item.appid),
            tasks: taskMap.get(item.appid) ?? [],
            category: this.options.categories?.find(g => g.appIds.includes(item.appid))?.name,
        }));

        return workerWxaList;
    }
}
