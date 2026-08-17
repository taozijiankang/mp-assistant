import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { requestGetPlanList, requestSetPlans } from "@/api";
import { useApiCall } from "@/hooks/useApiCall";
import { WSConnection, WSMessageEvent } from "@/ws/WSConnection";
import { WSMessage } from "@mp-assistant/common/dist/ws/index.js";
import type { Plan } from "@mp-assistant/common/dist/types/plan.js";

/**
 * 全局计划列表 store，监听内容变更事件自动刷新
 */
export const usePlanStore = defineStore("plan", () => {
  const { call: fetchList, loading, data: planList } = useApiCall(requestGetPlanList);
  const saving = ref(false);

  const setPlans = async (plans: Plan[]) => {
    saving.value = true;
    try {
      const res = await requestSetPlans(plans);
      planList.value = res.data;
    } finally {
      saving.value = false;
    }
  };

  // 已启用计划所包含的小程序 appid 集合（用于「计划中」标记）
  const plannedAppids = computed<Record<string, true>>(() => {
    const map: Record<string, true> = {};
    for (const plan of planList.value ?? []) {
      if (!plan.enabled) continue;
      for (const app of plan.apps) {
        map[app.appid] = true;
      }
    }
    return map;
  });

  const init = () => {
    fetchList();
    WSConnection.instance.on(WSMessage.ContentChanged.type, fetchList);
    WSConnection.instance.on(WSMessageEvent.connect, fetchList);
  };

  return { planList, loading, saving, plannedAppids, fetchList, setPlans, init };
});
