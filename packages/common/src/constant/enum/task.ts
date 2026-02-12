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