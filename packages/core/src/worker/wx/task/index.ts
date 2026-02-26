import { InspectVersionTask } from "./InspectVersionTask.js";
import { AuditTask } from "./AuditTask.js";
import { ReleaseTask } from "./ReleaseTask.js";
import { BaseTask } from "../../BaseTask.js";
import { TaskType, WXTaskN } from "mp-assistant-common/dist/work/task/index.js";

export {
    InspectVersionTask,
    AuditTask,
    ReleaseTask,
}

export const isInspectVersionTask = (task: BaseTask): task is InspectVersionTask => {
    return task.type === TaskType.WX_INSPECT_VERSION;
}

export const isAuditTask = (task: BaseTask): task is AuditTask => {
    return task.type === TaskType.WX_AUDIT;
}

export const isReleaseTask = (task: BaseTask): task is ReleaseTask => {
    return task.type === TaskType.WX_PUBLISH;
}

export const createTask = (type: TaskType, options: any): BaseTask => {
    switch (type) {
        case TaskType.WX_INSPECT_VERSION:
            return new InspectVersionTask(options as WXTaskN.TaskOptions);
        case TaskType.WX_AUDIT:
            return new AuditTask(options as WXTaskN.TaskOptions);
        case TaskType.WX_PUBLISH:
            return new ReleaseTask(options as WXTaskN.TaskOptions);
    }
}