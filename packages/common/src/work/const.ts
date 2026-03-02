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
