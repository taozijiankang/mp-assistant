import { BrowserContext } from "playwright";
import { getUUID } from "mp-assistant-common/dist/utils/index.js";
import { TaskExecResultType, WXTaskType } from "mp-assistant-common/dist/constant/enum.js";

export abstract class BaseTask<C = any, O = any> {
    readonly type: WXTaskType | null = null;

    key: string;

    config: C;

    /** 任务输出 */
    protected output?: O;

    constructor(config: C) {
        this.key = getUUID();
        this.config = config;
    }

    getOutput() {
        return JSON.parse(JSON.stringify(this.output)) as O;
    }

    /**
    * 开始执行任务
    */
    abstract exec(browserContent: BrowserContext): Promise<TaskExecResultType>;
}
