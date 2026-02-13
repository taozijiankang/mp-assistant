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