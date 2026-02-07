import { BrowserContext } from "playwright";
import { getUUID } from "mp-assistant-common/dist/utils/index.js";

export class BaseTask {
    key: string;
    constructor(protected browserContent: BrowserContext) {
        this.key = getUUID();
    }

    /**
     * 开始执行任务
     */
    async start() { }

    /**
     * 停止执行任务
     */
    async stop() { }
}
