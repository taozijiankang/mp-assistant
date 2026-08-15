<template>
  <div class="wx-overview">
    <div class="overview-header">
      <span class="overview-title">微信小程序总览</span>
      <span class="overview-summary">{{ wxWorkers.length }} 个 Worker · {{ filteredRows.length }} / {{ rows.length }} 个小程序</span>
      <span v-if="listLoading" class="loading-tip">加载中...</span>
      <span class="overview-selected">已选 {{ selectedCells.length }} 个</span>
      <el-button v-if="selectedCells.length" size="small" plain @click="clearSelection">清空选择</el-button>
    </div>

    <div class="overview-search">
      <el-input
        v-model="searchKeywords"
        type="textarea"
        :autosize="{ minRows: 1, maxRows: 4 }"
        class="search-keywords"
        placeholder="批量搜索，用 , 或 ; 分隔关键字"
        clearable
      />
      <div class="search-group">
        <span class="search-label">字段</span>
        <el-radio-group v-model="searchField" size="small">
          <el-radio-button value="appName">小程序名字</el-radio-button>
          <el-radio-button value="appid">appid</el-radio-button>
        </el-radio-group>
      </div>
      <div class="search-group">
        <span class="search-label">匹配</span>
        <el-radio-group v-model="searchType" size="small">
          <el-radio-button value="fuzzy">模糊</el-radio-button>
          <el-radio-button value="exact">全匹配</el-radio-button>
        </el-radio-group>
      </div>
      <el-button size="small" @click="clearSearch">清空</el-button>
    </div>

    <div v-if="unmatchedKeywords.length" class="search-unmatched">
      未匹配到的关键字：{{ unmatchedKeywords.join("、") }}
    </div>

    <div class="overview-main">
      <div class="overview-body">
        <el-table
          v-if="rows.length"
          :data="filteredRows"
          class="overview-table"
          height="100%"
          border
          stripe
          size="small"
        >
          <el-table-column
            v-for="worker in wxWorkers"
            :key="worker.key"
            :label="worker.options.name"
            min-width="160"
          >
            <template #default="{ row }">
              <div
                v-if="row.workers.has(worker.key)"
                class="app-cell"
                :class="{ selected: isSelectedCell(row.appid, worker.key) }"
                @click.stop="toggleCell(row.appid, worker.key)"
              >
                <img :src="row.appHeadimg" class="app-avatar" />
                <div class="app-info">
                  <div class="app-name">{{ row.appName }}</div>
                  <div class="app-id">{{ row.appid }}</div>
                </div>
                <img v-if="isSelectedCell(row.appid, worker.key)" src="@/assets/check.png" class="cell-check" />
              </div>
              <span v-else class="member-empty">-</span>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-else-if="!listLoading" description="暂无小程序数据" />
      </div>
      <div class="overview-side">
        <BatchAddTaskForm :selected-cells="selectedCells" @done="clearSelection" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useApiCall } from "@/hooks/useApiCall";
import { requestGetWorkerList } from "@/api";
import { WSConnection, WSMessageEvent } from "@/ws/WSConnection";
import { WSMessage } from "@mp-assistant/common/dist/ws/index.js";
import { isWXWorkerInfo } from "@mp-assistant/common/dist/work/index.js";
import BatchAddTaskForm from "./component/BatchAddTaskForm/index.vue";
import type { SelectedCell } from "./index";

interface OverviewRow {
  appid: string;
  appName: string;
  appHeadimg: string;
  workers: Set<string>;
}

const { call: fetchList, loading: listLoading, data: workerList } = useApiCall(requestGetWorkerList);

const wxWorkers = computed(() =>
  [...(workerList.value ?? [])]
    .filter(isWXWorkerInfo)
    .sort((a, b) => (b.options.weight ?? 0) - (a.options.weight ?? 0))
);

const rows = computed<OverviewRow[]>(() => {
  const map = new Map<string, OverviewRow>();
  for (const worker of wxWorkers.value) {
    for (const item of worker.wxaList ?? []) {
      let row = map.get(item.appid);
      if (!row) {
        row = {
          appid: item.appid,
          appName: item.app_name,
          appHeadimg: item.app_headimg,
          workers: new Set(),
        };
        map.set(item.appid, row);
      }
      row.workers.add(worker.key);
    }
  }
  return [...map.values()].sort((a, b) => a.appName.localeCompare(b.appName));
});

const searchKeywords = ref("");
const searchField = ref<"appName" | "appid">("appName");
const searchType = ref<"fuzzy" | "exact">("fuzzy");

const keywordList = computed(() =>
  searchKeywords.value
    .split(/[,;]/)
    .map(k => k.trim())
    .filter(Boolean)
);

const filteredRows = computed<OverviewRow[]>(() => {
  if (!keywordList.value.length) return rows.value;
  const isExact = searchType.value === "exact";
  const field = searchField.value;
  return rows.value.filter(row => {
    const target = (field === "appid" ? row.appid : row.appName).toLowerCase();
    return keywordList.value.some(kw => {
      const k = kw.toLowerCase();
      return isExact ? target === k : target.includes(k);
    });
  });
});

const unmatchedKeywords = computed(() => {
  if (searchType.value !== "exact" || !keywordList.value.length) return [] as string[];
  const field = searchField.value;
  const values = rows.value.map(row =>
    (field === "appid" ? row.appid : row.appName).toLowerCase()
  );
  return keywordList.value.filter(kw => !values.includes(kw.toLowerCase()));
});

const clearSearch = () => {
  searchKeywords.value = "";
};

const selectedCells = ref<SelectedCell[]>([]);

const toggleCell = (appid: string, workerKey: string) => {
  const index = selectedCells.value.findIndex(c => c.appid === appid && c.workerKey === workerKey);
  if (index >= 0) {
    selectedCells.value.splice(index, 1);
  } else {
    selectedCells.value.push({ appid, workerKey });
  }
};

const isSelectedCell = (appid: string, workerKey: string) =>
  selectedCells.value.some(c => c.appid === appid && c.workerKey === workerKey);

const clearSelection = () => {
  selectedCells.value = [];
};

onMounted(() => {
  fetchList();
  WSConnection.instance.on(WSMessage.Worker.ListChange.type, fetchList);
  WSConnection.instance.on(WSMessageEvent.connect, fetchList);
});

onUnmounted(() => {
  WSConnection.instance.off(WSMessage.Worker.ListChange.type, fetchList);
  WSConnection.instance.off(WSMessageEvent.connect, fetchList);
});
</script>

<style scoped lang="scss">
@use "./index.scss";
</style>
