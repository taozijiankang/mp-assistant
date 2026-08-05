import { BrowserContext } from "playwright";
import { BaseWorker } from "./BaseWorker.js";
import { WXWorker } from "./wx/WXWorker.js";
import { BaseTask } from "./BaseTask.js";
import { WXAuditTask } from "./wx/task/wxAuditTask/index.js";
import { WXLoginTask } from "./wx/task/wxLoginTask/index.js";
import { WXInspectVersionTask } from "./wx/task/wxInspectVersionTask/index.js";
import { WXPublishTask } from "./wx/task/wxPublishTask/index.js";
import { WXAuditExecutor } from "./wx/task/wxAuditTask/executor.js";
import { WXLoginExecutor } from "./wx/task/wxLoginTask/executor.js";
import { WXInspectVersionExecutor } from "./wx/task/wxInspectVersionTask/executor.js";
import { WXPublishExecutor } from "./wx/task/wxPublishTask/executor.js";
import { WXTaskExecutor } from "./wx/WXTaskExecutor.js";
import {
    WorkerType,
    WXTaskType,
    BaseTaskOptions,
    BaseWorkerOptions,
    WXAuditTaskOptions,
    WXLoginTaskOptions,
    WXInspectVersionTaskOptions,
    WXPublishTaskOptions,
    WXWorkerOptions
} from "@mp-assistant/common/dist/work/index.js";

export function createWorker(type: WorkerType.WX, options: WXWorkerOptions, key?: string): WXWorker;
export function createWorker(type: WorkerType, options: BaseWorkerOptions, key?: string): BaseWorker;
export function createWorker(type: WorkerType, options: BaseWorkerOptions, key?: string): BaseWorker {
    switch (type) {
        case WorkerType.WX:
            return new WXWorker({
                options: options as WXWorkerOptions,
                key,
            });
        default:
            throw new Error(`Unsupported worker type: ${type}`);
    }
}

export function createTask(type: WXTaskType.WX_AUDIT, options: WXAuditTaskOptions): WXAuditTask;
export function createTask(type: WXTaskType.WX_LOGIN, options: WXLoginTaskOptions): WXLoginTask;
export function createTask(type: WXTaskType.WX_INSPECT_VERSION, options: WXInspectVersionTaskOptions): WXInspectVersionTask;
export function createTask(type: WXTaskType.WX_PUBLISH, options: WXPublishTaskOptions): WXPublishTask;
export function createTask(type: WXTaskType, options: BaseTaskOptions): BaseTask;
export function createTask(type: WXTaskType, options: BaseTaskOptions): BaseTask {
    switch (type) {
        case WXTaskType.WX_AUDIT:
            return new WXAuditTask({
                options: options as WXAuditTaskOptions,
            });
        case WXTaskType.WX_LOGIN:
            return new WXLoginTask({
                options: options as WXLoginTaskOptions,
            });
        case WXTaskType.WX_INSPECT_VERSION:
            return new WXInspectVersionTask({
                options: options as WXInspectVersionTaskOptions,
            });
        case WXTaskType.WX_PUBLISH:
            return new WXPublishTask({
                options: options as WXPublishTaskOptions,
            });
        default:
            throw new Error(`Unsupported task type: ${type}`);
    }
}

export function createExecutor(type: WXTaskType, options: BaseTaskOptions, browserContent: BrowserContext): WXTaskExecutor {
    switch (type) {
        case WXTaskType.WX_AUDIT:
            return new WXAuditExecutor(options as WXAuditTaskOptions, browserContent);
        case WXTaskType.WX_LOGIN:
            return new WXLoginExecutor(options as WXLoginTaskOptions, browserContent);
        case WXTaskType.WX_INSPECT_VERSION:
            return new WXInspectVersionExecutor(options as WXInspectVersionTaskOptions, browserContent);
        case WXTaskType.WX_PUBLISH:
            return new WXPublishExecutor(options as WXPublishTaskOptions, browserContent);
        default:
            throw new Error(`Unsupported task type: ${type}`);
    }
}

// Worker type guard
export function isWXWorker(worker: BaseWorker): worker is WXWorker {
    return worker.type === WorkerType.WX;
}

// Task type guards
export function isWXAuditTask(task: BaseTask): task is WXAuditTask {
    return task.type === WXTaskType.WX_AUDIT;
}

export function isWXLoginTask(task: BaseTask): task is WXLoginTask {
    return task.type === WXTaskType.WX_LOGIN;
}

export function isWXInspectVersionTask(task: BaseTask): task is WXInspectVersionTask {
    return task.type === WXTaskType.WX_INSPECT_VERSION;
}

export function isWXPublishTask(task: BaseTask): task is WXPublishTask {
    return task.type === WXTaskType.WX_PUBLISH;
}