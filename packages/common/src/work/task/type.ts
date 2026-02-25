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

    export interface VersionListItem {
        version?: string;
        publisher?: string;
        publishTime?: string;
        remark?: string;
        actionBtn: any;
    }

    export type GetVersionListResult = {
        type: VersionType
        data?: VersionListItem[]
    } | null;

    export enum VersionType {
        ONLINE = "online",
        TEST = "test",
        DEVELOP = "develop"
    }

    export interface VersionConfigItem {
        container: string;
        publisherLabel: string;
        timeLabel: string;
        remarkLabel: string;
        actionButton: string;
    }

    export const VERSION_CONFIG: Record<VersionType, VersionConfigItem> = {
        [VersionType.ONLINE]: {
            container: '.code_version_online',
            publisherLabel: '发布者',
            timeLabel: '发布时间',
            remarkLabel: '项目备注',
            actionButton: '详情',
        },
        [VersionType.TEST]: {
            container: '.code_version_test',
            publisherLabel: '开发者',
            timeLabel: '提交审核时间',
            remarkLabel: '审核说明',
            actionButton: '详情',
        },
        [VersionType.DEVELOP]: {
            container: '.code_version_dev',
            publisherLabel: '开发者',
            timeLabel: '提交时间',
            remarkLabel: '项目备注',
            actionButton: '提交审核',
        }
    }
}