import { useLocalStore } from "../hooks/useLocalStore.js";
import type { ReviewTemplate } from "@mp-assistant/common/dist/types/reviewTemplate.js";
import { getStoreDir } from "../pathManage.js";
import { WSStore } from "./WSStore.js";
import { WSMessage } from "@mp-assistant/common/dist/ws/index.js";

const { get: getReviewTemplateLocalStore, set: setReviewTemplateLocalStore } = useLocalStore<ReviewTemplate[]>('reviewTemplateList', [], {
    storeDir: getStoreDir(),
});

export class ReviewTemplateStore {
    private static __instance: ReviewTemplateStore | null = null;
    public static get instance() {
        return this.__instance ?? (this.__instance = new ReviewTemplateStore());
    }

    private __reviewTemplateList: ReviewTemplate[] = [];

    get reviewTemplateList() {
        return [...this.__reviewTemplateList];
    }

    constructor() {
        this.__reviewTemplateList = getReviewTemplateLocalStore();
    }

    setReviewTemplateList(templates: ReviewTemplate[]) {
        this.__reviewTemplateList = templates;
        setReviewTemplateLocalStore(this.__reviewTemplateList);
        WSStore.instance.broadcast(WSMessage.ContentChanged.createMessage());
    }
}
