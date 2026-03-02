import { WXWorker } from "./wx/WXWorker.js";
import { BaseWorkerOptions, WorkerType } from "@mp-assistant/common/dist/work/index.js";
import { BaseWorker } from "./BaseWorker.js";

export {
    WXWorker,
}

export const createWorker = (type: WorkerType, options: BaseWorkerOptions): BaseWorker => {
    switch (type) {
        case WorkerType.WX:
            return new WXWorker(options);
        default:
            throw new Error(`找不到类型 ${type} 的worker`);
    }
}

export const isWXWorker = (worker: BaseWorker): worker is WXWorker => {
    return worker.type === WorkerType.WX;
}