<template>
  <div class="home">
    <div class="home-top">
      <span class="top-title">Worker</span>
      <div class="top-list">
        <WorkerCard
          v-for="worker in sortedWorkerList"
          :key="worker.key"
          :info="worker"
          :active="selectedKey === worker.key"
          @select="selectedKey = worker.key"
        />
      </div>
      <span v-if="loading && workerList === null" class="loading-tip">加载中...</span>
      <el-button type="primary" size="small" @click="addWorkerDialog?.open()">添加</el-button>
    </div>
    <div class="home-bottom">
      <WXWorkerDetail
        v-if="selectedWorker"
        :worker-key="selectedWorker.key"
        :worker-list-item="selectedWorker"
        @edit="handleEditWorker"
        @toggle-suspend="handleToggleSuspend"
        @remove="handleRemoveWorker"
      />
      <div v-else-if="showEmpty" class="home-empty">
        <el-empty description="暂无 Worker，请点击右上角「添加」创建" />
      </div>
    </div>
    <AddWorkerDialog ref="addWorkerDialog" @success="handleWorkerSaved" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { storeToRefs } from "pinia";
import { ElMessage, ElMessageBox } from "element-plus";
import { useApiCall } from "@/hooks/useApiCall";
import { latestCall } from "@/utils/latestCall";
import { requestGetWorkerList, requestRemoveWorker, requestPauseAndRecoverWorker } from "@/api";
import { WorkerStatus } from "@mp-assistant/common/dist/work/const.js";
import type { WorkerListItem, BaseWorkerInfo } from "@mp-assistant/common/dist/work/BaseWorker.js";
import { usePanelStore } from "@/stores/panel";
import { WSConnection, WSMessageEvent } from "@/ws/WSConnection";
import { WSMessage } from "@mp-assistant/common/dist/ws/index.js";
import WorkerCard from "./component/WorkerCard/index.vue";
import WXWorkerDetail from "@/component/WXWorkerDetail/index.vue";
import AddWorkerDialog from "@/component/AddWorkerDialog/index.vue";

const { selectedWorkerKey: selectedKey } = storeToRefs(usePanelStore());
const addWorkerDialog = ref<InstanceType<typeof AddWorkerDialog> | null>(null);

const { call: fetchWorkerList, loading, data: workerList } = useApiCall(requestGetWorkerList);
// WS 通知高频触发，用 latestCall 合并请求
const refreshList = latestCall(() => fetchWorkerList(), 2000);

onMounted(() => {
  refreshList();
  WSConnection.instance.on(WSMessage.WorkerListChanged.type, refreshList);
  WSConnection.instance.on(WSMessageEvent.connect, refreshList);
});

onUnmounted(() => {
  WSConnection.instance.off(WSMessage.WorkerListChanged.type, refreshList);
  WSConnection.instance.off(WSMessageEvent.connect, refreshList);
});

const sortedWorkerList = computed(() =>
  [...(workerList.value ?? [])].sort((a, b) => b.weight - a.weight)
);

const selectedWorker = computed(() => sortedWorkerList.value.find(w => w.key === selectedKey.value) ?? null);

const showEmpty = computed(() => !loading.value && workerList.value !== null);

// 列表变化后，若当前选中失效则自动选中第一个
watch(workerList, () => {
  if (sortedWorkerList.value.length > 0 && (!selectedKey.value || !sortedWorkerList.value.find(w => w.key === selectedKey.value))) {
    selectedKey.value = sortedWorkerList.value[0].key;
  }
});

const handleEditWorker = () => {
  if (!selectedWorker.value) return;
  addWorkerDialog.value?.open(selectedWorker.value);
};

// 添加/编辑 Worker 成功后，用接口返回的 worker 信息更新本地列表，不等 WS 推送
const handleWorkerSaved = (info: BaseWorkerInfo) => {
  const item: WorkerListItem = {
    key: info.key,
    type: info.type,
    status: info.status,
    name: info.options.name,
    weight: info.options.weight ?? 0
  };
  const list = [...(workerList.value ?? [])];
  const idx = list.findIndex(w => w.key === item.key);
  if (idx >= 0) list[idx] = item;
  else list.push(item);
  workerList.value = list;
};

const { call: toggleSuspend } = useApiCall(requestPauseAndRecoverWorker);

const handleToggleSuspend = async () => {
  if (!selectedWorker.value) return;
  const key = selectedWorker.value.key;
  const suspend = selectedWorker.value.status === WorkerStatus.RUNNING;
  try {
    await toggleSuspend({ key, suspend });
    // 暂停/恢复接口无返回数据，直接按操作结果更新本地列表状态
    const list = workerList.value;
    if (list) {
      workerList.value = list.map(w =>
        w.key === key ? { ...w, status: suspend ? WorkerStatus.PAUSED : WorkerStatus.RUNNING } : w
      );
    }
  } catch {}
};

const { call: removeWorker } = useApiCall(requestRemoveWorker);

const handleRemoveWorker = async () => {
  if (!selectedWorker.value) return;
  const key = selectedWorker.value.key;
  await ElMessageBox.confirm(`确定删除 "${selectedWorker.value.name}" 吗？`, "删除确认", {
    type: "warning"
  });
  try {
    await removeWorker({ key });
    // 删除接口无返回数据，直接从本地列表移除
    const list = workerList.value;
    if (list) workerList.value = list.filter(w => w.key !== key);
    selectedKey.value = null;
    ElMessage.success("删除成功");
  } catch {}
};

</script>

<style scoped lang="scss">
@use "./index.scss";
</style>
