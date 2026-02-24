import type { TaskType } from "mp-assistant-common/dist/work/task";

export interface AddTaskForm {
    appIds: string[];
    type: TaskType;
}