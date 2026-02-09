import { BrowserContext } from "playwright";
import { getUUID } from "mp-assistant-common/dist/utils/index.js";
import { TaskExecResultType, WXTaskType } from "mp-assistant-common/dist/constant/enum.js";

export abstract class BaseTask<C = any> {
    readonly type: WXTaskType | null = null;

    key: string;

    config: C;

    constructor(config: C) {
        this.key = getUUID();
        this.config = config;
    }

    /**
    * 开始执行任务
    */
    abstract exec(browserContent: BrowserContext): Promise<TaskExecResultType>;
}
