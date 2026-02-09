export enum AuthenticatorStatus {
    LOGIN = 'login',
    NOT_LOGIN = 'notLogin'
}

export enum WXTaskType {
    /** 登录 */
    LOGIN = 'login',
    /** 切换小程序 */
    SWITCH_MP = 'switchMP',
    /** 审核 */
    AUDIT = 'audit',
    /** 发布 */
    PUBLISH = 'publish',
}

/**
 * 任务执行状态类型
 */
export enum TaskExecStatusType {
    /** 闲置 */
    IDLE = "idle",
    /** 重置中（任务重置时使用） */
    RESETING = "reseting",
    /** 运行中 */
    RUNNING = "running",
    /** 完成 */
    COMPLETED = "completed",
    /** 失败 */
    FAILED = "failed",
    /** 等待下一个任务 */
    WAITING_NEXT = "waitingNext"
}