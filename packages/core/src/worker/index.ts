import { BrowserContext } from "playwright";
import { BaseWorker } from "./BaseWorker.js";
import { WXWorker } from "./wx/WXWorker.js";
import { BaseTask } from "./BaseTask.js";
import { WXAuditTask } from "./wx/task/wxAuditTask/index.js";
import { WXLoginTask } from "./wx/task/wxLoginTask/index.js";
import { WXInspectVersionTask } from "./wx/task/wxInspectVersionTask/index.js";
import { WXPublishTask } from "./wx/task/wxPublishTask/index.js";
import {
    WorkerType,
    WXTaskType,
    BaseTaskOptions,
    BaseWorkerOptions,
    WXAuditTaskOptions,
    WXLoginTaskOptions,
    WXInspectVersionTaskOptions,
    WXPublishTaskOptions,
    WXWorkerOptions,
    WXPublishTaskInfo,
    WXLoginTaskInfo,
    WXAuditTaskInfo,
    WXInspectVersionTaskInfo,
    BaseTaskInfo,
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

export function createTask(type: WXTaskType.WX_AUDIT, options: WXAuditTaskOptions, info?: Omit<Partial<WXAuditTaskInfo>, 'options'>, browserContent?: BrowserContext): WXAuditTask;
export function createTask(type: WXTaskType.WX_LOGIN, options: WXLoginTaskOptions, info?: Omit<Partial<WXLoginTaskInfo>, 'options'>, browserContent?: BrowserContext): WXLoginTask;
export function createTask(type: WXTaskType.WX_INSPECT_VERSION, options: WXInspectVersionTaskOptions, info?: Omit<Partial<WXInspectVersionTaskInfo>, 'options'>, browserContent?: BrowserContext): WXInspectVersionTask;
export function createTask(type: WXTaskType.WX_PUBLISH, options: WXPublishTaskOptions, info?: Omit<Partial<WXPublishTaskInfo>, 'options'>, browserContent?: BrowserContext): WXPublishTask;
export function createTask(type: WXTaskType, options: BaseTaskOptions, info?: Omit<Partial<BaseTaskInfo>, 'options'>, browserContent?: BrowserContext): BaseTask;
export function createTask(type: WXTaskType, options: BaseTaskOptions, info?: Omit<Partial<BaseTaskInfo>, 'options'>, browserContent?: BrowserContext): BaseTask {
    switch (type) {
        case WXTaskType.WX_AUDIT:
            return new WXAuditTask({
                options: options as WXAuditTaskOptions,
                info: info as Omit<Partial<WXAuditTaskInfo>, 'options'>,
                browserContent,
            });
        case WXTaskType.WX_LOGIN:
            return new WXLoginTask({
                options: options as WXLoginTaskOptions,
                info: info as Omit<Partial<WXLoginTaskInfo>, 'options'>,
                browserContent,
            });
        case WXTaskType.WX_INSPECT_VERSION:
            return new WXInspectVersionTask({
                options: options as WXInspectVersionTaskOptions,
                info: info as Omit<Partial<WXInspectVersionTaskInfo>, 'options'>,
                browserContent,
            });
        case WXTaskType.WX_PUBLISH:
            return new WXPublishTask({
                options: options as WXPublishTaskOptions,
                info: info as Omit<Partial<WXPublishTaskInfo>, 'options'>,
                browserContent,
            });
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