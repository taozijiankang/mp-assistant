import { TaskType, TaskStatus } from "../enum/task.js";

export const TaskTypeDict = {
    [TaskType.WX_INSPECT_VERSION]: '检查小程序版本',
    [TaskType.WX_AUDIT]: '审核',
    [TaskType.WX_PUBLISH]: '发布',
}

export const TaskStatusDict = {
    [TaskStatus.NOT_STARTED]: '未开始',
    [TaskStatus.RUNNING]: '执行中',
    [TaskStatus.WAITING_RESULT]: '等待结果',
    [TaskStatus.COMPLETED]: '完成',
    [TaskStatus.FAILED]: '失败'
}