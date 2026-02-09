import { TaskExecStatusType } from "mp-assistant-common/dist/constant/enum.js";
import { BaseWorker } from "../BaseWorker.js";

export class WXMPWorker extends BaseWorker {
    protected async _taskCycle() {
        // 默认运行第一个工作
        if (!this.getCurrentJob()) {
            this.setCurrentJobKey(this.jobList[0]?.key ?? '');
        }
        const currentJob = this.getCurrentJob();
        if (!currentJob) {
            return;
        }
        // 默认运行第一个任务
        if (!this.getCurrentTask()) {
            this.setCurrentTaskKey(currentJob.taskList[0]?.key ?? '');
        }
        const currentTask = this.getCurrentTask();
        if (!currentTask) {
            return;
        }
        //
        const currentTaskExecStatus = currentTask.getExecStatus();
        // 开始任务
        if (currentTaskExecStatus === TaskExecStatusType.IDLE) {
            console.log(`开始 ${currentJob.title} 的 ${currentTask.type} 任务`);
            currentTask.startExec(this.getBrowserContent());
        }
        // 任务已经开始运行
        else {
            // 任务正在运行或停止中
            if (
                currentTaskExecStatus === TaskExecStatusType.RUNNING ||
                currentTaskExecStatus === TaskExecStatusType.RESETING
            ) {
                return;
            }
            // 如果运行失败则重新执行整个job的任务
            if (currentTaskExecStatus === TaskExecStatusType.FAILED) {
                currentJob.taskList.forEach(task => {
                    task.resetExec();
                });
                this.setCurrentTaskKey(currentJob.taskList[0]?.key ?? '');
                return;
            }
            // 如果任务成功或者等待后续则跳到下一个任务或者下一个job
            if (currentTaskExecStatus === TaskExecStatusType.COMPLETED || currentTaskExecStatus === TaskExecStatusType.WAITING_NEXT) {
                const nextTaskIndex = currentJob.taskList.findIndex(task => task.key === currentTask.key) + 1;
                if (nextTaskIndex < currentJob.taskList.length) {
                    this.setCurrentTaskKey(currentJob.taskList[nextTaskIndex]?.key ?? '');
                }
                // 当前job的任务全部完成 则跳到下一个job
                else {
                    const currentJobIndex = this.jobList.findIndex(job => job.key === currentJob.key) + 1;
                    if (currentJobIndex < this.jobList.length) {
                        this.setCurrentJobKey(this.jobList[currentJobIndex]?.key ?? '');
                    } else {
                        // 回到第一个job 循环执行 直到任务全部完成
                        this.setCurrentJobKey('');
                    }
                    //
                    this.succeedJobList.push(currentJob);
                    this.jobList = this.jobList.filter(job => job.key !== currentJob.key);
                }
            }
            return;
        }
    }
}
