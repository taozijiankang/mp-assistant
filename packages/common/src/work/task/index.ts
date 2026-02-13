export enum TaskType {
    /** 检查小程序版本 */
    WX_INSPECT_VERSION = "wxnInspectVersion",
    /** 审核 */
    WX_AUDIT = "wxnAudit",
    /** 发布 */
    WX_PUBLISH = "wxnPublish",
}

export enum TaskStatus {
    /** 未开始 */
    NOT_STARTED = "notStarted",
    /** 执行中 */
    RUNNING = "running",
    /** 等待结果 */
    WAITING_RESULT = "waitingResult",
    /** 完成 */
    COMPLETED = "completed",
    /** 失败 */
    FAILED = "failed",
}

export const TaskTypeDict = {
    [TaskType.WX_INSPECT_VERSION]: '检查小程序版本',
    [TaskType.WX_AUDIT]: '审核',
    [TaskType.WX_PUBLISH]: '发布',
}

export const TaskStatusDict = {
    [TaskStatus.NOT_STARTED]: '未开始',
    [TaskStatus.RUNNING]: '执行中',
    [TaskStatus.WAITING_RESULT]: '等待结果',
    [TaskStatus.COMPLETED]: '完成',
    [TaskStatus.FAILED]: '失败'
}