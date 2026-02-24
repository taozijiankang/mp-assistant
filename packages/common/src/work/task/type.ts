import { TaskStatus, TaskType } from "./index.js";

export interface BaseTaskOptions { }

export interface BaseTaskInfo {
    key: string;
    type: TaskType;
    status: TaskStatus;
    runningReportList: TaskRunningReport[];
    options?: any;
    result?: TaskExecResult;
}

export interface BaseWXTaskOptions {
    /** 小程序名称 */
    app_name: string;
    /** 小程序原始id */
    username: string;
}

export interface WXTaskInfo extends BaseTaskInfo {
    type: TaskType.WX_INSPECT_VERSION | TaskType.WX_AUDIT | TaskType.WX_PUBLISH;
    options: BaseWXTaskOptions;
}

export interface TaskRunningReport {
    title: string;
    timestamp: number;
    description?: string;
    images?: string[];
}

export interface TaskExecResult {
    status: TaskStatus.COMPLETED | TaskStatus.WAITING_RESULT | TaskStatus.FAILED;
    message?: string;
}