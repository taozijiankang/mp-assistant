import { BaseTaskInfo, WXTaskInfo } from "./type.js";


export enum TaskType {
    /** 检查小程序版本 */
    WX_INSPECT_VERSION = "wxnInspectVersion",
    /** 审核 */
    WX_AUDIT = "wxnAudit",
    /** 发布 */
    WX_PUBLISH = "wxnPublish",
}

export enum TaskStatus {
    /** 未开始 */
    NOT_STARTED = "notStarted",
    /** 执行中 */
    RUNNING = "running",
    /** 完成 */
    COMPLETED = "completed",
    /** 失败 */
    FAILED = "failed",
}

export const TaskTypeDict = {
    [TaskType.WX_INSPECT_VERSION]: '检查小程序版本',
    [TaskType.WX_AUDIT]: '审核',
    [TaskType.WX_PUBLISH]: '发布',
}

export const TaskStatusDict = {
    [TaskStatus.NOT_STARTED]: '未开始',
    [TaskStatus.RUNNING]: '执行中',
    [TaskStatus.COMPLETED]: '完成',
    [TaskStatus.FAILED]: '失败'
}

export const TaskTypeOptions = Object.values(TaskType).map(type => ({
    label: TaskTypeDict[type],
    value: type,
}));

export const taskCompleted = (taskStatus: TaskStatus) => {
    return taskStatus === TaskStatus.COMPLETED || taskStatus === TaskStatus.FAILED;
}

export const isWXTaskInfo = (info: BaseTaskInfo): info is WXTaskInfo => {
    return info.type === TaskType.WX_INSPECT_VERSION || info.type === TaskType.WX_AUDIT || info.type === TaskType.WX_PUBLISH;
}

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