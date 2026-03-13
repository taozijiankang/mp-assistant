import { WXMPItem } from "../types/wx.js";
import { WSMessage } from "../ws/message.js";
import { WorkerType } from "./const.js";
import { BaseTaskInfo } from "./task/index.js";

export * from "./const.js"

export interface BaseWorkerOptions {
    key?: string;
    name?: string;
    wsMessageEventHandler: WSMessage.Event;
}

export interface BaseWorkInfo {
    name: string;
    type: WorkerType;
    key: string;
    taskList: BaseTaskInfo[];
    status: WorkerStatus;
    loadings: string[];
}

export enum WorkerStatus {
    PAUSED = "paused",
    DELETED = "deleted",
    RUNNING = "running",
}

export const WorkerStatusDict = {
    [WorkerStatus.PAUSED]: '暂停',
    [WorkerStatus.DELETED]: '删除',
    [WorkerStatus.RUNNING]: '运行',
}

export namespace WXWorkerN {
    export interface WXWorkInfo extends BaseWorkInfo {
        type: WorkerType.WX;
        isLogin: boolean;
        loginQRCodeFilePath: string;
        wxaList: WXMPItem[];
        markWXAppIds: string[];
    }

    export enum LoadingType {
        /** 登录 */
        login = 'login',
        /** 更新微信小程序列表 */
        updateWxaListWxaList = 'updateWxaListWxaList',
        /** 登出 */
        logout = 'logout',
        /** 删除用户数据目录 */
        deleteUserDataDir = 'deleteUserDataDir',
    }

    export const isWXWorkerInfo = (info: BaseWorkInfo): info is WXWorkInfo => {
        return info.type === WorkerType.WX;
    }
}


