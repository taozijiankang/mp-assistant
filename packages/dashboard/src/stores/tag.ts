import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { requestGetTagList, requestSetTags } from "@/api";
import { useApiCall } from "@/hooks/useApiCall";
import { latestCall } from "@/utils/latestCall";
import { WSConnection, WSMessageEvent } from "@/ws/WSConnection";
import { WSMessage } from "@mp-assistant/common/dist/ws/index.js";
import type { Tag } from "@mp-assistant/common/dist/types/tag.js";

/**
 * 全局标签列表 store，监听内容变更事件自动刷新
 */
export const useTagStore = defineStore("tag", () => {
  const { call: fetchTagList, loading, data: tagList } = useApiCall(requestGetTagList);
  // WS 通知高频触发，用 latestCall 合并请求
  const fetchList = latestCall(() => fetchTagList(), 2000);
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

  // 被「隐藏」类型且已启用的标签标记的小程序 appid 集合（这些小程序不在版本视图和总览中显示）
  const hiddenAppids = computed<Set<string>>(() => {
    const set = new Set<string>();
    for (const tag of tagList.value ?? []) {
      if (!tag.enabled || tag.type !== "hidden") continue;
      for (const app of tag.apps) {
        set.add(app.appid);
      }
    }
    return set;
  });

  const init = () => {
    fetchList();
    WSConnection.instance.on(WSMessage.TagChanged.type, fetchList);
    WSConnection.instance.on(WSMessageEvent.connect, fetchList);
  };

  return { tagList, loading, saving, appTags, hiddenAppids, fetchList, setTags, init };
});
