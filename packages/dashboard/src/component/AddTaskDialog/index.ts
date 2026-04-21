import type { TaskType } from "@mp-assistant/common/dist/work/task";
import type { VersionPositioner } from "@mp-assistant/common/dist/utils/wx";

export interface AddTaskForm {
    appIds: string[];
    type: TaskType;
}

export interface AddTaskFormData {
    appIds?: string[];
    type?: TaskType;
    positioner?: VersionPositioner[];
    populateData?: {
        versionDescription?: string;
        imagePreview?: string[];
        videoPreview?: string[];
    };
}

/**
 * 批量添加任务的目标项：一个 worker + 该 worker 下选中的多个小程序
 */
export interface AddTaskBatchTarget {
    workerKey: string;
    workerName?: string;
    appIds: string[];
}
