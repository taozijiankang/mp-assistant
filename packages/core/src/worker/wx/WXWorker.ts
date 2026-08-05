import { TaskStatus, WorkerType } from "@mp-assistant/common/dist/work/const.js";
import { BaseWorker } from "../BaseWorker.js";
import { WXWorkerInfo, WXWorkerOptions } from "@mp-assistant/common/dist/work/wx/WXWorker.js";
import { isWXLoginTaskInfo } from "@mp-assistant/common/dist/work/index.js";

export class WXWorker extends BaseWorker<WXWorkerOptions, WXWorkerInfo> {
    readonly type = WorkerType.WX;

    info(): WXWorkerInfo {
        return {
            ...super.info(),
            loginQRCode: this.getLoginQRCode(),
            wxaList: this.getWxaList(),
        } as WXWorkerInfo;
    }

    /** 从运行中的登录任务获取二维码（未登录且有码时返回） */
    private getLoginQRCode(): string | undefined {
        for (const task of super.info().taskList) {
            if (task.status === TaskStatus.RUNNING && isWXLoginTaskInfo(task) && task.loginQRCode) {
                return task.loginQRCode;
            }
        }
    }

    /** 获取最近完成的登录任务的小程序列表 */
    private getWxaList() {
        for (const task of super.info().taskList) {
            if (task.status === TaskStatus.COMPLETED && isWXLoginTaskInfo(task)) {
                return task.wxaList;
            }
        }
    }
}
