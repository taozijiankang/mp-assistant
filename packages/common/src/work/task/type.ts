import { VersionListItem } from "../../types/wx.js";
import { TaskStatus, TaskType } from "./index.js";

export interface BaseTaskInfo {
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
}

export namespace WXTask {
    export interface TaskOptions {
        /** 小程序名称 */
        app_name: string;
        /** 小程序原始id */
        username: string;
    }

    export interface TaskInfo extends BaseTaskInfo {
        type: TaskType.WX_INSPECT_VERSION | TaskType.WX_AUDIT | TaskType.WX_PUBLISH;
        options: TaskOptions;
    }

    export interface InspectVersionInfo extends TaskInfo {
        result: TaskExecResult<GetVersionListResult[]>
    }

    export type VersionListData = {
        [key in VersionType]?: VersionListItem[]
    }

    export type GetVersionListResult = VersionListData | null;

    export enum VersionType {
        ONLINE = "online_info",
        TEST = "experience_info",
        DEVELOP = "develop_info"
    }

}