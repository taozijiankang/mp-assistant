import { LoginTask } from "./LoginTask.js";
import { SwitchMPTask } from "./SwitchMPTask.js";
import { AuditTask } from "./AuditTask.js";
import { ReleaseTask } from "./ReleaseTask.js";
import { BaseTask } from "../../BaseTask.js";
import { WXTaskType } from "mp-assistant-common/dist/constant/enum.js";

export {
    LoginTask,
    SwitchMPTask,
    AuditTask,
    ReleaseTask,
}

export const isLoginTask = (task: BaseTask): task is LoginTask => {
    return task.type === WXTaskType.LOGIN;
}

export const isSwitchMPTask = (task: BaseTask): task is SwitchMPTask => {
    return task.type === WXTaskType.SWITCH_MP;
}

export const isAuditTask = (task: BaseTask): task is AuditTask => {
    return task.type === WXTaskType.AUDIT;
}

export const isReleaseTask = (task: BaseTask): task is ReleaseTask => {
    return task.type === WXTaskType.PUBLISH;
}