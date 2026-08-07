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
      <span v-if="listLoading" class="loading-tip">加载中...</span>
      <el-button type="primary" size="small" @click="addWorkerDialog?.open()">添加</el-button>
    </div>
    <div class="home-bottom">
      <WXWorkerDetail
        v-if="selectedWorker?.type === WorkerType.WX"
        :worker="selectedWorker"
        @edit="handleEditWorker"
        @toggle-suspend="handleToggleSuspend"
        @remove="handleRemoveWorker"
      />
    </div>
    <AddWorkerDialog ref="addWorkerDialog" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { useApiCall } from "@/hooks/useApiCall";
import {
  requestGetWorkerList,
  requestRemoveWorker,
  requestPauseAndRecoverWorker,
} from "@/api";
import { WSConnection } from "@/ws/WSConnection";
import { WSMessage } from "@mp-assistant/common/dist/ws/index.js";
import { WorkerStatus, WorkerType } from "@mp-assistant/common/dist/work/const.js";
import WorkerCard from "./component/WorkerCard/index.vue";
import WXWorkerDetail from "@/component/WXWorkerDetail/index.vue";
import AddWorkerDialog from "@/component/AddWorkerDialog/index.vue";

const selectedKey = ref<string | null>(null);
const addWorkerDialog = ref<InstanceType<typeof AddWorkerDialog> | null>(null);

const { call: fetchList, loading: listLoading, data: workerList } = useApiCall(requestGetWorkerList, {
  onCallAfter: () => {
    if (sortedWorkerList.value.length > 0) {
      if (!selectedKey.value || !sortedWorkerList.value.find(w => w.key === selectedKey.value)) {
        selectedKey.value = sortedWorkerList.value[0].key;
      }
    }
  },
});

const sortedWorkerList = computed(() =>
  [...(workerList.value ?? [])].sort((a, b) => (b.options.weight ?? 0) - (a.options.weight ?? 0))
);

const selectedWorker = computed(() =>
  sortedWorkerList.value?.find((w) => w.key === selectedKey.value) ?? null
);

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
    await fetchList();
  } catch {}
};

const { call: removeWorker } = useApiCall(requestRemoveWorker);

const handleRemoveWorker = async () => {
  if (!selectedWorker.value) return;
  await ElMessageBox.confirm(`确定删除 "${selectedWorker.value.options.name}" 吗？`, "删除确认", {
    type: "warning",
  });
  try {
    await removeWorker({ key: selectedWorker.value.key });
    selectedKey.value = null;
    await fetchList();
    ElMessage.success("删除成功");
  } catch {}
};

onMounted(() => {
  fetchList();
  WSConnection.instance.on(WSMessage.Worker.ListChange.type, () => {
    fetchList();
  });
});
</script>

<style scoped lang="scss">
@use "./index.scss";
</style>
