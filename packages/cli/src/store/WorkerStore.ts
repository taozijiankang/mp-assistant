import { WorkerType, BaseWorkerOptions } from "@mp-assistant/common/dist/work/index.js";
import { useLocalStore } from "../hooks/useLocalStore.js";
import type { BaseWorker } from "@mp-assistant/core/dist/worker/BaseWorker.js";
import { createWorker } from "@mp-assistant/core/dist/worker/index.js";
import { getStoreDir } from "../pathManage.js";
import { WSStore } from "./WSStore.js";
import { WSMessage } from "@mp-assistant/common/dist/ws/index.js";

/** WS 高频通知节流窗口（毫秒），任务运行期间报告/状态变化频繁，合并成一次广播 */
const WS_THROTTLE_MS = 300;

interface WorkerStoreItem {
    key: string;
    type: WorkerType;
    options: BaseWorkerOptions;
}

const { get: getWorkerLocalStoreList, set: setWorkerLocalStoreList } = useLocalStore<WorkerStoreItem[]>('workerList', [], {
    storeDir: getStoreDir(),
});

/**
 * 节流：首次立即执行，wait 窗口内最多再补一次尾调。
 * 前端收到通知后会重新拉取最新数据，因此合并通知不会丢失最终状态。
 */
function throttle(fn: () => void, wait: number): () => void {
    let last = 0;
    let timer: NodeJS.Timeout | null = null;

    return () => {
        const now = Date.now();
        const remaining = wait - (now - last);
        if (remaining <= 0) {
            if (timer) {
                clearTimeout(timer);
                timer = null;
            }
            last = now;
            fn();
        } else if (!timer) {
            timer = setTimeout(() => {
                timer = null;
                last = Date.now();
                fn();
            }, remaining);
        }
    };
}

/** 按 key 隔离的节流器，避免不同 worker/task 的通知互相延迟或丢失 */
class KeyedThrottle {
    private map = new Map<string, () => void>();

    trigger(key: string, fn: () => void, wait: number): void {
        let throttled = this.map.get(key);
        if (!throttled) {
            throttled = throttle(fn, wait);
            this.map.set(key, throttled);
        }
        throttled();
    }

    clear(key: string): void {
        this.map.delete(key);
    }

    clearByPrefix(prefix: string): void {
        for (const key of this.map.keys()) {
            if (key.startsWith(prefix)) {
                this.map.delete(key);
            }
        }
    }
}

export class WorkerStore {
    private static __instance: WorkerStore | null = null;
    public static get instance() {
        return this.__instance ?? (this.__instance = new WorkerStore());
    }

    private __workerList: BaseWorker[] = [];

    private detailThrottle = new KeyedThrottle();
    private taskThrottle = new KeyedThrottle();

    get workerList() {
        return [...this.__workerList];
    }

    constructor() {
        this.loadData();
    }

    private bindWorkerEvent(worker: BaseWorker): void {
        worker.on('listChange', () => {
            this.saveData();
            WSStore.instance.broadcast(WSMessage.WorkerListChanged.createMessage());
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
