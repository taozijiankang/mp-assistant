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
    loadings: string[];
}


export namespace WXWorkerN {
    export interface WXWorkInfo extends BaseWorkInfo {
        type: WorkerType.WX;
        isLogin: boolean;
        loginQRCodeURL: string;
        wxaList: WXMPItem[];
    }

    export enum LoadingType {
        /** 登录 */
        login = 'login',
        /** 更新微信小程序列表 */
        updateWxaListWxaList = 'updateWxaListWxaList',
    }

    export const isWXWorkerInfo = (info: BaseWorkInfo): info is WXWorkInfo => {
        return info.type === WorkerType.WX;
    }
}

