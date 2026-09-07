import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { requestGetTagList, requestSetTags } from "@/api";
import { useApiCall } from "@/hooks/useApiCall";
import { WSConnection, WSMessageEvent } from "@/ws/WSConnection";
import { WSMessage } from "@mp-assistant/common/dist/ws/index.js";
import type { Tag } from "@mp-assistant/common/dist/types/tag.js";

/**
 * 全局标签列表 store，监听内容变更事件自动刷新
 */
export const useTagStore = defineStore("tag", () => {
  const { call: fetchList, loading, data: tagList } = useApiCall(requestGetTagList);
  const saving = ref(false);

  const setTags = async (tags: Tag[]) => {
    saving.value = true;
    try {
      const res = await requestSetTags(tags);
      tagList.value = res.data;
    } finally {
      saving.value = false;
    }
  };

  // 每个小程序命中的已启用标签列表（用于展示多个彩色标签）
  const appTags = computed<Record<string, Tag[]>>(() => {
    const map: Record<string, Tag[]> = {};
    for (const tag of tagList.value ?? []) {
      if (!tag.enabled) continue;
      for (const app of tag.apps) {
        (map[app.appid] ??= []).push(tag);
      }
    }
    return map;
  });

  const init = () => {
    fetchList();
    WSConnection.instance.on(WSMessage.ContentChanged.type, fetchList);
    WSConnection.instance.on(WSMessageEvent.connect, fetchList);
  };

  return { tagList, loading, saving, appTags, fetchList, setTags, init };
});
