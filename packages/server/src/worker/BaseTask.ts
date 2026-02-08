import { BrowserContext } from "playwright";
import { getUUID } from "mp-assistant-common/dist/utils/index.js";
import { TaskExecStatusType } from "mp-assistant-common/dist/constant/enum.js";

export abstract class BaseTask {
    key: string;

    private execStatus: TaskExecStatusType | null = null;

    constructor() {
        this.key = getUUID();
    }

    getExecStatus() {
        return this.execStatus;
    }

    setExecStatus(status: TaskExecStatusType) {
        this.execStatus = status;
    }

    /**
     * 开始执行任务
     */
    protected abstract startExec(browserContent: BrowserContext): Promise<void>;

    /**
     * 停止执行任务
     */
    protected abstract stopExec(): Promise<void>;
}
