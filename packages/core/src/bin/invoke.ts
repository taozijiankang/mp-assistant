import { fileURLToPath } from "node:url";
import { ChildProcess, fork } from "node:child_process";
import { BaseTaskInfo, BaseTaskOptions } from "@mp-assistant/common/dist/work/index.js";
import path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function invokeExecuteTask(type: string, options: BaseTaskOptions, info: BaseTaskInfo, debugPort: number): ChildProcess {
    return fork(path.join(__dirname, 'executeTask.js'), [
        type,
        JSON.stringify(options),
        JSON.stringify(info),
        debugPort.toString()
    ]);
}