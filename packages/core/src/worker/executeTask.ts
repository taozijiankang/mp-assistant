import { WXTaskType, BaseTaskOptions } from "@mp-assistant/common/dist/work/index.js";
import { fileURLToPath, pathToFileURL } from "node:url";
import { ChildProcess, fork } from "node:child_process";
import path from "node:path";
import { chromium } from "playwright";
import { createExecutor } from "./index.js";

const __filename = fileURLToPath(import.meta.url);

export function executeTask(type: string, options: BaseTaskOptions, debugPort: number): ChildProcess {
    return fork(__filename, [type, JSON.stringify(options), debugPort.toString()]);
}

// 子进程入口：根据 taskType 创建对应 Executor 并执行
if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
    const taskType = process.argv[2] || '';
    const options = process.argv[3] ? JSON.parse(process.argv[3]) : {};
    const debugPort = process.argv[4] ? parseInt(process.argv[4]) : undefined;

    if (!taskType) {
        console.error('Task type is required');
        process.exit(1);
    }
    if (!debugPort) {
        console.error('Debug port is required');
        process.exit(1);
    }

    const browser = await chromium.connectOverCDP(`http://localhost:${debugPort}`);
    const browserContext = browser.contexts()[0];

    if (!browserContext) {
        console.error('Browser context is not found');
        process.exit(1);
    }

    const executor = createExecutor(taskType as WXTaskType, options, browserContext);
    await executor.execute();
}
