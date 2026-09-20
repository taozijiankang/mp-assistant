import { TaskStatus, WXTaskType } from "./const.js";

export interface BaseTaskOptions {
    /** 是否为定时任务（结束后间隔一段时间自动重置重跑） */
    scheduled?: boolean;
    /** 定时任务间隔时间（秒） */
    interval?: number;
    /** 失败后自动重试的最大次数；0 或不设置为不重试 */
    retryTimes?: number;
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
    /** 失败后已自动重试的次数 */
    retryCount?: number;
}

/** 任务摘要（精简，供 worker 详情面板的任务卡片使用，不含全量报告） */
export interface BaseTaskSummary {
    key: string;
    type: WXTaskType;
    status: TaskStatus;
    createdTime: string;
    completedMessage: string;
    /** 任务完成/失败的时间戳（毫秒），供定时任务判断间隔 */
    completedTime?: number;
    /** 执行次数，任务每次运行累加 */
    runCount?: number;
    /** 失败后已自动重试的次数 */
    retryCount?: number;
    options: BaseTaskOptions;
    /** 只保留最新一条报告 */
    lastReport?: TaskReport;
}