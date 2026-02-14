import { BaseWorkInfo, WXWorkInfo } from "./type.js";

export enum WorkerType {
    WX = "wx",
}

export const WorkerTypeDict = {
    [WorkerType.WX]: '微信小程序',
}

export const WorkerTypeOptions = [
    {
        value: WorkerType.WX,
        label: '微信小程序',
    },
]

export const isWXWorkerInfo = (info: BaseWorkInfo): info is WXWorkInfo => {
    return info.type === WorkerType.WX;
}