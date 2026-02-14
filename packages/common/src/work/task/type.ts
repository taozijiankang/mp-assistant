import { TaskStatus, TaskType } from "./index.js";

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

export interface BaseTaskInfo {
    key: string;
    type: TaskType;
    status: TaskStatus;
    runningReportList: TaskRunningReport[];
    params?: any;
    result?: TaskExecResult;
}

export interface BaseWXTaskParams {
    /** 小程序名称 */
    app_name: string;
    /** 小程序原始id */
    username: string;
}

export interface WXTaskInfo extends BaseTaskInfo {
    type: TaskType.WX_INSPECT_VERSION | TaskType.WX_AUDIT | TaskType.WX_PUBLISH;
    params: BaseWXTaskParams;
}