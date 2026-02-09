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
    /** 运行中 */
    RUNNING = 'running',
    /** 完成 */
    COMPLETED = 'completed',
    /** 失败 */
    FAILED = 'failed',
    /** 等待 */
    WAITING = 'waiting',
}