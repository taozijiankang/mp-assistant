import { BrowserContext } from "playwright";
import { getUUID } from "mp-assistant-common/dist/utils/index.js";
import { TaskExecStatusType, WXTaskType } from "mp-assistant-common/dist/constant/enum.js";

export abstract class BaseTask<C = any> {
    readonly type: WXTaskType | null = null;

    key: string;

    execStatus: TaskExecStatusType = TaskExecStatusType.IDLE;

    config: C;

    constructor(config: C) {
        this.key = getUUID();

        this.config = config;
    }

    getExecStatus() {
        return this.execStatus;
    }

    /**
     * 状态流转
     * @param status 
     */
    setExecStatus(newStatus: TaskExecStatusType) {
        const oldStatus = this.execStatus;
        if (oldStatus === newStatus) {
            return;
        }
        switch (oldStatus) {
            case TaskExecStatusType.IDLE:
                if (newStatus !== TaskExecStatusType.RUNNING) {
                    throw new Error(`IDLE状态不能流转到${newStatus}状态`);
                }
                break;
            case TaskExecStatusType.RUNNING:
                if (
                    newStatus !== TaskExecStatusType.COMPLETED &&
                    newStatus !== TaskExecStatusType.FAILED &&
                    newStatus !== TaskExecStatusType.WAITING_NEXT
                ) {
                    throw new Error(`RUNNING状态不能流转到${newStatus}状态`);
                }
                break;
            case TaskExecStatusType.COMPLETED:
                if (newStatus !== TaskExecStatusType.RUNNING) {
                    throw new Error(`COMPLETED状态不能流转到${newStatus}状态`);
                }
                break;
            case TaskExecStatusType.FAILED:
                if (newStatus !== TaskExecStatusType.RUNNING) {
                    throw new Error(`FAILED状态不能流转到${newStatus}状态`);
                }
                break;
            case TaskExecStatusType.WAITING_NEXT:
                if (newStatus !== TaskExecStatusType.RUNNING) {
                    throw new Error(`WAITING_NEXT状态不能流转到${newStatus}状态`);
                }
                break;
            case TaskExecStatusType.RESETING:
                if (newStatus !== TaskExecStatusType.IDLE) {
                    throw new Error(`RESETING状态不能流转到${newStatus}状态`);
                }
                break;
        }
        this.execStatus = newStatus;
    }

    /**
    * 开始执行任务
    */
    startExec(browserContent: BrowserContext) {
        if (this.getExecStatus() === TaskExecStatusType.RUNNING) {
            return;
        }
        this.setExecStatus(TaskExecStatusType.RUNNING);
        //
        this.startExec_(browserContent);
    }

    /**
    * 重置执行任务
    */
    resetExec() {
        if (this.getExecStatus() === TaskExecStatusType.RESETING) {
            return;
        }
        this.setExecStatus(TaskExecStatusType.RESETING);
        //
        this.resetExec_();
    }


    abstract startExec_(browserContent: BrowserContext): Promise<void>;


    abstract resetExec_(): Promise<void>;
}
