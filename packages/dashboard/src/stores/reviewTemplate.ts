import { defineStore } from "pinia";
import { ref } from "vue";
import { requestGetReviewTemplateList, requestSetReviewTemplates } from "@/api";
import { useApiCall } from "@/hooks/useApiCall";
import { latestCall } from "@/utils/latestCall";
import { WSConnection, WSMessageEvent } from "@/ws/WSConnection";
import { WSMessage } from "@mp-assistant/common/dist/ws/index.js";
import type { ReviewTemplate } from "@mp-assistant/common/dist/types/reviewTemplate.js";

/**
 * 全局审核模板列表 store，监听内容变更事件自动刷新
 */
export const useReviewTemplateStore = defineStore("reviewTemplate", () => {
  const { call: fetchReviewTemplateList, loading, data: reviewTemplateList } = useApiCall(requestGetReviewTemplateList);
  // WS 通知高频触发，用 latestCall 合并请求
  const fetchList = latestCall(() => fetchReviewTemplateList(), 2000);
  const saving = ref(false);

  const setReviewTemplates = async (templates: ReviewTemplate[]) => {
    saving.value = true;
    try {
      const res = await requestSetReviewTemplates(templates);
      reviewTemplateList.value = res.data;
    } finally {
      saving.value = false;
    }
  };

  const init = () => {
    fetchList();
    WSConnection.instance.on(WSMessage.ReviewTemplateChanged.type, fetchList);
    WSConnection.instance.on(WSMessageEvent.connect, fetchList);
  };

  return { reviewTemplateList, loading, saving, fetchList, setReviewTemplates, init };
});
