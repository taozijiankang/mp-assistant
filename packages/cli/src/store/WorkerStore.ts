import { WorkerType } from "mp-assistant-common/dist/constant/enum/worker.js";
import { getStoreDir } from "../pathManage.js";
import { useLocalStore } from "../hooks/useLocalStore.js";
import type { BaseWorker } from "mp-assistant-core/dist/worker/BaseWorker.js";
import { createWorker } from "mp-assistant-core/dist/worker/index.js";

interface WorkerStoreItem {
    key: string;
    type: WorkerType;
}

const { get: getWorkerLocalStoreList, set: setWorkerLocalStoreList } = useLocalStore<WorkerStoreItem[]>('workerList', [], {
    storeDir: getStoreDir(),
});

export class WorkerStore {
    private static _instance: WorkerStore | null = null;
    public static get instance() {
        return this._instance ?? (this._instance = new WorkerStore());
    }

    private __workerList: BaseWorker[] = [];

    get workerList() {
        return [...this.__workerList];
    }

    constructor() {
        this.__workerList = getWorkerLocalStoreList().map(item => {
            return createWorker(item.type, {
                key: item.key,
            });
        });
    }

    addWorker(worker: BaseWorker) {
        this.__workerList.push(worker);
        setWorkerLocalStoreList([...getWorkerLocalStoreList(), {
            key: worker.key,
            type: worker.type!,
        }]);
    }

    removeWorker(worker: BaseWorker) {
        this.__workerList = this.__workerList.filter(w => w.key !== worker.key);
        setWorkerLocalStoreList(getWorkerLocalStoreList().filter(item => item.key !== worker.key));
    }
}