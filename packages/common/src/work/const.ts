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

export enum WorkerStatus {
    INIT = "init",
    PAUSED = "paused",
    RUNNING = "running",
}

export const WorkerStatusDict = {
    [WorkerStatus.INIT]: '初始化',
    [WorkerStatus.PAUSED]: '暂停',
    [WorkerStatus.RUNNING]: '运行',
}

export enum WXTaskType {
    /** 登录 */
    WX_LOGIN = "wxLogin",
    /** 检查版本 */
    WX_INSPECT_VERSION = "wxInspectVersion",
    /** 审核 */
    WX_AUDIT = "wxAudit",
    /** 发布 */
    WX_PUBLISH = "wxPublish",
}

export enum TaskStatus {
    /** 空闲 */
    IDLE = "idle",
    /** 执行中 */
    RUNNING = "running",
    /** 完成 */
    COMPLETED = "completed",
    /** 失败 */
    FAILED = "failed",
}

export const WXTaskTypeDict = {
    [WXTaskType.WX_LOGIN]: '登录',
    [WXTaskType.WX_INSPECT_VERSION]: '检查版本',
    [WXTaskType.WX_AUDIT]: '审核',
    [WXTaskType.WX_PUBLISH]: '发布',
}

export const WXTaskTypeOptions = [
    {
        value: WXTaskType.WX_LOGIN,
        label: '登录',
    },
    {
        value: WXTaskType.WX_INSPECT_VERSION,
        label: '检查版本',
    },
    {
        value: WXTaskType.WX_AUDIT,
        label: '审核',
    },
    {
        value: WXTaskType.WX_PUBLISH,
        label: '发布',
    },
]