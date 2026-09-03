import { TaskStatus, WXTaskType } from "./const.js";

export interface BaseTaskOptions {
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
}