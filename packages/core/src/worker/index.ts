import { WorkerType, WXTaskType } from "@mp-assistant/common/dist/work/const.js";
import { BaseWorker } from "./BaseWorker.js";
import { WXWorker } from "./wx/WXWorker.js";
import { BaseWorkerOptions } from "@mp-assistant/common/dist/work/BaseWorker.js";
import { BaseTask } from "./BaseTask.js";
import { BaseTaskOptions } from "@mp-assistant/common/dist/work/BaseTask.js";
import { WXAuditTask } from "./wx/task/WXAuditTask.js";
import { WXAuditTaskOptions } from "@mp-assistant/common/dist/work/wx/tasks/WXAuditTask.js";
import { WXWorkerOptions } from "@mp-assistant/common/dist/work/wx/WXWorker.js";
import { WXLoginTask } from "./wx/task/WXLoginTask.js";
import { WXLoginTaskOptions } from "@mp-assistant/common/dist/work/wx/tasks/WXLoginTask.js";
import { WXInspectVersionTask } from "./wx/task/WXInspectVersionTask.js";
import { WXInspectVersionTaskOptions } from "@mp-assistant/common/dist/work/wx/tasks/WXInspectVersionTask.js";
import { WXPublishTask } from "./wx/task/WXPublishTask.js";
import { WXPublishTaskOptions } from "@mp-assistant/common/dist/work/wx/tasks/WXPublishTask.js";

export {
    BaseWorker,
}

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

export function createTask(type: WXTaskType, options: BaseTaskOptions, isExecutor: boolean = false): BaseTask {
    switch (type) {
        case WXTaskType.WX_AUDIT:
            return new WXAuditTask({
                options: options as WXAuditTaskOptions,
            }, isExecutor);
        case WXTaskType.WX_LOGIN:
            return new WXLoginTask({
                options: options as WXLoginTaskOptions,
            }, isExecutor);
        case WXTaskType.WX_INSPECT_VERSION:
            return new WXInspectVersionTask({
                options: options as WXInspectVersionTaskOptions,
            }, isExecutor);
        case WXTaskType.WX_PUBLISH:
            return new WXPublishTask({
                options: options as WXPublishTaskOptions,
            }, isExecutor);
        default:
            throw new Error(`Unsupported task type: ${type}`);
    }
}