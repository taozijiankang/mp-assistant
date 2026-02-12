import { InspectVersionTask } from "./InspectVersionTask.js";
import { AuditTask } from "./AuditTask.js";
import { ReleaseTask } from "./ReleaseTask.js";
import { BaseTask } from "../../BaseTask.js";
import { TaskType } from "mp-assistant-common/dist/constant/enum/task.js";

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