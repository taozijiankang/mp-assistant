import { defineStore } from "pinia";
import { ref } from "vue";
import type { SelectedCell } from "@/view/wx-overview/index";

/**
 * 面板操作记录：持久化用户在面板中的操作状态
 */
export const usePanelStore = defineStore(
  "panel",
  () => {
    // 首页选中的 worker key
    const selectedWorkerKey = ref<string | null>(null);

    // 总览页搜索关键字与筛选类型
    const overviewSearchKeywords = ref("");
    const overviewSearchField = ref<"appName" | "appid">("appName");
    const overviewSearchType = ref<"fuzzy" | "exact">("fuzzy");

    // 总览页选中的小程序
    const overviewSelectedCells = ref<SelectedCell[]>([]);

    // 总览页标签筛选
    const overviewTagFilters = ref<string[]>([]);

    // 版本视图：小程序搜索关键字与提交者筛选（持久化，跨 worker 保留）
    const versionViewSearchText = ref("");
    const versionViewVisibleDevs = ref<string[]>([]);

    // 版本视图：标签筛选
    const versionViewTagFilters = ref<string[]>([]);

    return {
      selectedWorkerKey,
      overviewSearchKeywords,
      overviewSearchField,
      overviewSearchType,
      overviewSelectedCells,
      overviewTagFilters,
      versionViewSearchText,
      versionViewVisibleDevs,
      versionViewTagFilters,
    };
  },
  {
    persist: true,
  }
);
