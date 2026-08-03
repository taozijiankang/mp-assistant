import { WorkerType } from "@mp-assistant/common/dist/work/index.js";
import { useLocalStore } from "../hooks/useLocalStore.js";
import type { BaseWorker } from "@mp-assistant/core/dist/worker/BaseWorker.js";
import { getStoreDir } from "../pathManage.js";

interface WorkerStoreItem {
    key: string;
    type: WorkerType;
    name: string;
    /** 排序权重，数值越大越靠前 */
    weight?: number;
    /** 微信 worker 已标记的小程序 appid 列表 */
    markWXAppIds?: string[];
}

const { get: getWorkerLocalStoreList, set: setWorkerLocalStoreList } = useLocalStore<WorkerStoreItem[]>('workerList', [], {
    storeDir: getStoreDir(),
});

export class WorkerStore {
    private static __instance: WorkerStore | null = null;
    public static get instance() {
        return this.__instance ?? (this.__instance = new WorkerStore());
    }

    private __workerList: BaseWorker[] = [];

    get workerList() {
        return [...this.__workerList];
    }

    constructor() {

    }

    addWorker(worker: BaseWorker) {
        this.__workerList.push(worker);

        this.saveData();
    }

    removeWorker(worker: BaseWorker) {
        this.__workerList = this.__workerList.filter(w => w.key !== worker.key);

        this.saveData();
    }

    saveData() {
        //
    }
}