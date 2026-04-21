import type { TaskType } from "@mp-assistant/common/dist/work/task";
import type { VersionPositioner } from "@mp-assistant/common/dist/utils/wx";

export interface AddTaskFormData {
    type?: TaskType;
    positioner?: VersionPositioner[];
    populateData?: {
        versionDescription?: string;
        imagePreview?: string[];
        videoPreview?: string[];
    };
}

/** 一个 worker + 该 worker 下选中的多个小程序 appId */
export interface AddTaskBatchTarget {
    workerKey: string;
    workerName?: string;
    appIds: string[];
}

/** 打开添加任务对话框：所有入口参数结构一致 */
export interface AddTaskDialogOpenOptions {
    targets: AddTaskBatchTarget[];
    formData?: AddTaskFormData;
}
