import { useLocalStore } from "../hooks/useLocalStore.js";
import type { Plan } from "@mp-assistant/common/dist/types/plan.js";
import { getStoreDir } from "../pathManage.js";
import { WSStore } from "./WSStore.js";
import { WSMessage } from "@mp-assistant/common/dist/ws/index.js";

const { get: getPlanLocalStore, set: setPlanLocalStore } = useLocalStore<Plan[]>('planList', [], {
    storeDir: getStoreDir(),
});

export class PlanStore {
    private static __instance: PlanStore | null = null;
    public static get instance() {
        return this.__instance ?? (this.__instance = new PlanStore());
    }

    private __planList: Plan[] = [];

    get planList() {
        return [...this.__planList];
    }

    constructor() {
        this.__planList = getPlanLocalStore();
    }

    setPlanList(plans: Plan[]) {
        this.__planList = plans;
        setPlanLocalStore(this.__planList);
        WSStore.instance.broadcast(WSMessage.ContentChanged.createMessage());
    }
}
