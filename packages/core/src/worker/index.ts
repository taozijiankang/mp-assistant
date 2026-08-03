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
import { BaseExecutor } from "./BaseExecutor.js";
import { BrowserContext } from "playwright";
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

export function createWorker(type: WorkerType, options: BaseWorkerOptions): BaseWorker {
    switch (type) {
        case WorkerType.WX:
            return new WXWorker({
                options: options as WXWorkerOptions,
            });
        default:
            throw new Error(`Unsupported worker type: ${type}`);
    }
}

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

export function createExecutor(type: WXTaskType, options: BaseTaskOptions, browserContext: BrowserContext): BaseExecutor {
    switch (type) {
        case WXTaskType.WX_AUDIT:
            return new WXAuditExecutor(options as WXAuditTaskOptions, browserContext);
        case WXTaskType.WX_LOGIN:
            return new WXLoginExecutor(options as WXLoginTaskOptions, browserContext);
        case WXTaskType.WX_INSPECT_VERSION:
            return new WXInspectVersionExecutor(options as WXInspectVersionTaskOptions, browserContext);
        case WXTaskType.WX_PUBLISH:
            return new WXPublishExecutor(options as WXPublishTaskOptions, browserContext);
        default:
            throw new Error(`Unsupported task type: ${type}`);
    }
}