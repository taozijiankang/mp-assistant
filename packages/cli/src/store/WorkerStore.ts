import { WorkerType, BaseWorkerOptions } from "@mp-assistant/common/dist/work/index.js";
import { useLocalStore } from "../hooks/useLocalStore.js";
import type { BaseWorker } from "@mp-assistant/core/dist/worker/BaseWorker.js";
import { createWorker } from "@mp-assistant/core/dist/worker/index.js";
import { getStoreDir } from "../pathManage.js";
import { WSStore, WS_THROTTLE_MS } from "./WSStore.js";
import { WSMessage } from "@mp-assistant/common/dist/ws/index.js";
import { throttle, KeyedThrottle } from "@mp-assistant/common/dist/utils/index.js";

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

    private detailThrottle = new KeyedThrottle();
    private taskThrottle = new KeyedThrottle();
    private listThrottle = throttle(() => {
        WSStore.instance.broadcast(WSMessage.WorkerListChanged.createMessage());
    }, WS_THROTTLE_MS);

    get workerList() {
        return [...this.__workerList];
    }

    constructor() {
        this.loadData();
    }

    private bindWorkerEvent(worker: BaseWorker): void {
        worker.on('listChange', () => {
            this.saveData();
            this.notifyListChanged();
        });
        worker.on('detailChange', ({ workerKey }) => {
            this.detailThrottle.trigger(workerKey, () => {
                WSStore.instance.broadcast(WSMessage.WorkerDetailChanged.createMessage({ workerKey }));
            }, WS_THROTTLE_MS);
        });
        worker.on('taskChange', ({ workerKey, taskKey }) => {
            this.taskThrottle.trigger(`${workerKey}:${taskKey}`, () => {
                WSStore.instance.broadcast(WSMessage.TaskDetailChanged.createMessage({ workerKey, taskKey }));
            }, WS_THROTTLE_MS);
        });
    }

    addWorker(worker: BaseWorker) {
        this.bindWorkerEvent(worker);
        this.__workerList.push(worker);
        this.saveData();
    }

    removeWorker(worker: BaseWorker) {
        worker.off('listChange');
        worker.off('detailChange');
        worker.off('taskChange');
        this.detailThrottle.clear(worker.key);
        this.taskThrottle.clearByPrefix(`${worker.key}:`);
        this.__workerList = this.__workerList.filter(w => w.key !== worker.key);
        this.saveData();
    }

    /** 广播 worker 列表变化（节流合并，避免高频触发造成网络压力） */
    notifyListChanged(): void {
        this.listThrottle();
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
