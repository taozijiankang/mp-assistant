export * from "./const.js"

export * from "./BaseTask.js";
export * from "./BaseWorker.js";
export * from "./wx/WXTask.js";
export * from "./wx/tasks/WXAuditTask.js";
export * from "./wx/tasks/WXInspectVersionTask.js";
export * from "./wx/tasks/WXLoginTask.js";
export * from "./wx/tasks/WXPublishTask.js";
export * from "./wx/WXWorker.js";

import type { BaseWorkerInfo } from "./BaseWorker.js";
import type { BaseTaskInfo } from "./BaseTask.js";
import type { WXWorkerInfo } from "./wx/WXWorker.js";
import type { WXTaskInfo } from "./wx/WXTask.js";
import type { WXLoginTaskInfo } from "./wx/tasks/WXLoginTask.js";
import type { WXAuditTaskInfo } from "./wx/tasks/WXAuditTask.js";
import type { WXInspectVersionTaskInfo } from "./wx/tasks/WXInspectVersionTask.js";
import type { WXPublishTaskInfo } from "./wx/tasks/WXPublishTask.js";
import { WorkerType, WXTaskType } from "./const.js";

// Worker type guards

export function isWXWorkerInfo(worker: BaseWorkerInfo): worker is WXWorkerInfo {
    return worker.type === WorkerType.WX;
}

// Task type guards

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function isWXTaskInfo(task: BaseTaskInfo): task is WXTaskInfo {
    return [
        WXTaskType.WX_LOGIN,
        WXTaskType.WX_AUDIT,
        WXTaskType.WX_INSPECT_VERSION,
        WXTaskType.WX_PUBLISH
    ].includes(task.type);
}

export function isWXLoginTaskInfo(task: BaseTaskInfo): task is WXLoginTaskInfo {
    return task.type === WXTaskType.WX_LOGIN;
}

export function isWXAuditTaskInfo(task: BaseTaskInfo): task is WXAuditTaskInfo {
    return task.type === WXTaskType.WX_AUDIT;
}

export function isWXInspectVersionTaskInfo(task: BaseTaskInfo): task is WXInspectVersionTaskInfo {
    return task.type === WXTaskType.WX_INSPECT_VERSION;
}

export function isWXPublishTaskInfo(task: BaseTaskInfo): task is WXPublishTaskInfo {
    return task.type === WXTaskType.WX_PUBLISH;
}