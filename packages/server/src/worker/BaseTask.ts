import { BrowserContext } from "playwright";
import { getUUID } from "mp-assistant-common/dist/utils/index.js";
import { TaskExecStatusType, WXTaskType } from "mp-assistant-common/dist/constant/enum.js";

export abstract class BaseTask<C = any> {
    readonly type: WXTaskType | null = null;

    key: string;

    execStatus: TaskExecStatusType | null = null;

    config: C;

    constructor(config: C) {
        this.key = getUUID();

        this.config = config;
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
    abstract startExec(browserContent: BrowserContext): Promise<void>;

    /**
     * 停止执行任务
     */
    abstract stopExec(): Promise<void>;
}
