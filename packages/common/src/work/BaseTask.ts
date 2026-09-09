import { TaskStatus, WXTaskType } from "./const.js";

export interface BaseTaskOptions {
    /** 是否为定时任务（结束后间隔一段时间自动重置重跑） */
    scheduled?: boolean;
    /** 定时任务间隔时间（秒） */
    interval?: number;
}

export interface TaskReport {
    /** 报告类型 */
    type: 'text' | 'image';
    /** 报告内容：文字报告为文本，图片报告为文件路径 */
    message: string;
    time: number;
}

export interface BaseTaskInfo {
    key: string;
    type: WXTaskType;
    status: TaskStatus;
    createdTime: string;
    options: BaseTaskOptions;
    reports: TaskReport[];
    completedMessage: string;
    /** 任务完成/失败的时间戳（毫秒），供定时任务判断间隔 */
    completedTime?: number;
    /** 执行次数，任务每次运行累加 */
    runCount?: number;
}