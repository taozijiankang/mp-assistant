import { VersionListItem } from "../../types/wx.js";
import { VersionPositioner } from "../../utils/wx.js";
import { TaskStatus, TaskType } from "./const.js";

export * from "./const.js";

export const taskCompleted = (taskStatus: TaskStatus) => {
    return taskStatus === TaskStatus.COMPLETED || taskStatus === TaskStatus.FAILED;
}

export interface BaseTaskInfo {
    workerKey: string;
    key: string;
    type: TaskType;
    status: TaskStatus;
    runningReportList: TaskRunningReport[];
    options?: any;
    result?: TaskExecResult;
}

export interface TaskRunningReport {
    title: string;
    timestamp: number;
    description?: string;
    images?: string[];
}

export interface TaskExecResult<T = any> {
    status: TaskStatus.COMPLETED | TaskStatus.FAILED;
    data?: T;
    msg?: string;
}

export namespace WXTaskN {
    export interface TaskOptions {
        /** 小程序名称 */
        app_name: string;
        /** 小程序原始id */
        username: string;
    }

    export interface AuditTaskOptions extends TaskOptions {
        positioner?: VersionPositioner[]
        populateData?: {
            // 版本描述
            versionDescription?: string
            // 图片预览
            imagePreview?: string
            // 视频预览
            videoPreview?: string
        }
    }

    export interface TaskInfo extends BaseTaskInfo {
        type: TaskType.WX_INSPECT_VERSION | TaskType.WX_AUDIT | TaskType.WX_PUBLISH;
        options: TaskOptions;
    }

    export const isWXTaskInfo = (info: BaseTaskInfo): info is WXTaskN.TaskInfo => {
        return info.type === TaskType.WX_INSPECT_VERSION || info.type === TaskType.WX_AUDIT || info.type === TaskType.WX_PUBLISH;
    }

    export interface InspectVersionInfo extends TaskInfo {
        result: TaskExecResult<GetVersionListResult[]>
    }


    export type VersionListData = {
        [VersionType.DEVELOP]?: VersionListItem[],
        [VersionType.ONLINE]?: VersionListItem,
        [VersionType.TEST]?: VersionListItem
    }

    export type GetVersionListResult = VersionListData | null;

    export enum VersionType {
        ONLINE = "online_info",
        TEST = "experience_info",
        DEVELOP = "develop_info"
    }

    export const VersionContainerDict = {
        [VersionType.DEVELOP]: ".code_version_dev",
        [VersionType.ONLINE]: ".code_version_online",
        [VersionType.TEST]: ".code_version_test",
    }
}