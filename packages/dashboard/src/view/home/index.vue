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
    <AddWorkerDialog ref="addWorkerDialog" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { storeToRefs } from "pinia";
import { ElMessage, ElMessageBox } from "element-plus";
import { useApiCall } from "@/hooks/useApiCall";
import { useLatestCall } from "@/hooks/useLatestCall";
import { requestGetWorkerList, requestRemoveWorker, requestPauseAndRecoverWorker } from "@/api";
import { WorkerStatus } from "@mp-assistant/common/dist/work/const.js";
import { usePanelStore } from "@/stores/panel";
import { WSConnection, WSMessageEvent } from "@/ws/WSConnection";
import { WSMessage } from "@mp-assistant/common/dist/ws/index.js";
import WorkerCard from "./component/WorkerCard/index.vue";
import WXWorkerDetail from "@/component/WXWorkerDetail/index.vue";
import AddWorkerDialog from "@/component/AddWorkerDialog/index.vue";

const { selectedWorkerKey: selectedKey } = storeToRefs(usePanelStore());
const addWorkerDialog = ref<InstanceType<typeof AddWorkerDialog> | null>(null);

const { run: refreshList, loading, data: workerList } = useLatestCall(requestGetWorkerList);

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

const { call: toggleSuspend } = useApiCall(requestPauseAndRecoverWorker);

const handleToggleSuspend = async () => {
  if (!selectedWorker.value) return;
  const suspend = selectedWorker.value.status === WorkerStatus.RUNNING;
  try {
    await toggleSuspend({ key: selectedWorker.value.key, suspend });
  } catch {}
};

const { call: removeWorker } = useApiCall(requestRemoveWorker);

const handleRemoveWorker = async () => {
  if (!selectedWorker.value) return;
  await ElMessageBox.confirm(`确定删除 "${selectedWorker.value.name}" 吗？`, "删除确认", {
    type: "warning"
  });
  try {
    await removeWorker({ key: selectedWorker.value.key });
    selectedKey.value = null;
    ElMessage.success("删除成功");
  } catch {}
};

</script>

<style scoped lang="scss">
@use "./index.scss";
</style>
