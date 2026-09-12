import { useLocalStore } from "../hooks/useLocalStore.js";
import type { Tag } from "@mp-assistant/common/dist/types/tag.js";
import { getStoreDir } from "../pathManage.js";
import { WSStore } from "./WSStore.js";
import { WSMessage } from "@mp-assistant/common/dist/ws/index.js";

const { get: getTagLocalStore, set: setTagLocalStore } = useLocalStore<Tag[]>('tagList', [], {
    storeDir: getStoreDir(),
});

export class TagStore {
    private static __instance: TagStore | null = null;
    public static get instance() {
        return this.__instance ?? (this.__instance = new TagStore());
    }

    private __tagList: Tag[] = [];

    get tagList() {
        return [...this.__tagList];
    }

    constructor() {
        this.__tagList = getTagLocalStore();
    }

    setTagList(tags: Tag[]) {
        this.__tagList = tags;
        setTagLocalStore(this.__tagList);
        WSStore.instance.broadcast(WSMessage.TagChanged.createMessage());
    }
}
