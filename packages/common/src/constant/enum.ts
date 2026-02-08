export enum AuthenticatorStatus {
    LOGIN = 'login',
    NOT_LOGIN = 'notLogin'
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
    /** 跳过 */
    SKIPPED = 'skipped',
    /** 等待 */
    WAITING = 'waiting',
}