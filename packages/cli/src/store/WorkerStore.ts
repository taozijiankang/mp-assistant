import { WorkerType, BaseWorkerOptions } from "@mp-assistant/common/dist/work/index.js";
import { useLocalStore } from "../hooks/useLocalStore.js";
import type { BaseWorker } from "@mp-assistant/core/dist/worker/BaseWorker.js";
import { createWorker } from "@mp-assistant/core/dist/worker/index.js";
import { getStoreDir } from "../pathManage.js";
import { WSStore } from "./WSStore.js";
import { WSMessage } from "@mp-assistant/common/dist/ws/index.js";

interface WorkerStoreItem {
    key: string;
    type: WorkerType;
    options: BaseWorkerOptions;
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
        this.loadData();
    }

    private bindWorkerEvent(worker: BaseWorker): void {
        worker.on('detailChange', () => {
            WSStore.instance.broadcast(WSMessage.Worker.DetailChange.createMessage({
                key: worker.key,
            }));
        });
    }

    addWorker(worker: BaseWorker) {
        this.bindWorkerEvent(worker);
        this.__workerList.push(worker);
        this.saveData();
    }

    removeWorker(worker: BaseWorker) {
        worker.off('detailChange');
        this.__workerList = this.__workerList.filter(w => w.key !== worker.key);
        this.saveData();
    }

    saveData(): void {
        const items: WorkerStoreItem[] = this.__workerList.map(w => ({
            key: w.key,
            type: w.type,
            options: w.info().options,
        }));
        setWorkerLocalStoreList(items);
    }

    private loadData(): void {
        const items = getWorkerLocalStoreList();
        for (const item of items) {
            const worker = createWorker(item.type, item.options, item.key);
            this.bindWorkerEvent(worker);
            this.__workerList.push(worker);
        }
    }
}
