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