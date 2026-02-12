import { TaskStatus } from "../constant/enum/task.js";

export interface TaskRunningReport {
    title: string;
    timestamp: number;
    description?: string;
    images?: string[];
}

export interface TaskExecResult<TOutput = any> {
    status: TaskStatus.COMPLETED | TaskStatus.WAITING_RESULT | TaskStatus.FAILED;
    message?: string;
    output?: TOutput;
}