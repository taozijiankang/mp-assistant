import { TaskExecStatusType } from "mp-assistant-common/dist/constant/enum.js";
import { BaseWorker } from "../BaseWorker.js";
import { isLoginTask, isSwitchMPTask } from "./task/index.js";

export class WXMPWorker extends BaseWorker {
    protected async _taskCycle() {
        // 默认运行第一个任务
        if (!this.onRunTask) {
            const taskList = this.getTaskList();
            if (taskList.length === 0) {
                return;
            }
            this.onRunTask = taskList[0]!;
        }
        //
        const onRunTask = this.onRunTask;
        const onRunTaskExecStatus = this.onRunTask.getExecStatus();
        // 任务已经开始运行
        if (onRunTaskExecStatus) {
            if (onRunTaskExecStatus === TaskExecStatusType.RUNNING) {
                return;
            }
            // 登录任务和切换小程序任务未成功会阻塞整个worker
            if (isLoginTask(onRunTask) || isSwitchMPTask(onRunTask)) {
                if (onRunTask.getExecStatus() !== TaskExecStatusType.COMPLETED) {
                    return;
                }
            }
            // 跳到下一个任务
            const onTaskIndex = this.getTaskList().findIndex(task => task.key === onRunTask.key);
            this.onRunTask = this.getTaskList()[onTaskIndex + 1] ?? null;
            return;
        }
        // 开始任务
        else {
            console.log('开始任务', onRunTask.type);
            onRunTask.startExec(this.getBrowserContent());
        }
    }
}
