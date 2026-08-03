import { BaseTaskOptions } from "@mp-assistant/common/dist/work/BaseTask.js";
import { fileURLToPath, pathToFileURL } from "node:url";
import { ChildProcess, fork } from "node:child_process";
import path from "node:path";
import { createTask } from "./index.js";
import { WXTaskType } from "@mp-assistant/common/dist/work/const.js";
import { chromium } from "playwright";

const __filename = fileURLToPath(import.meta.url);

export function executeTask(type: string, options: BaseTaskOptions, debugPort: number): ChildProcess {
    return fork(__filename, [type, JSON.stringify(options), debugPort.toString()]);
}

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
    const browserContent = browser.contexts()[0];

    if (!browserContent) {
        console.error('Browser content is not found');
        process.exit(1);
    }

    const task = createTask(taskType as WXTaskType, options, true);

    task.execute(browserContent);
}