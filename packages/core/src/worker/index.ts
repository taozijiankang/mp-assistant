import { WXWorker } from "./wx/WXWorker.js";
import { WorkerType } from "mp-assistant-common/dist/work/index.js";
import { BaseWorker } from "./BaseWorker.js";

export {
    WXWorker,
}

export const createWorker = (type: WorkerType, options?: {
    key?: string;
    name?: string;
}): BaseWorker => {
    switch (type) {
        case WorkerType.WX:
            return new WXWorker(options);
    }
}

export const isWXWorker = (worker: BaseWorker): worker is WXWorker => {
    return worker.type === WorkerType.WX;
}