<template>
  <div class="home">
    <div class="home-left">
      <div class="left-header">
        <span class="left-title">Worker 列表</span>
        <el-button type="primary" size="small" @click="addWorkerDialog?.open()">添加</el-button>
      </div>
      <div class="left-list">
        <WorkerCard
          v-for="worker in workerList"
          :key="worker.key"
          :info="worker"
          :active="selectedKey === worker.key"
          @select="selectedKey = worker.key"
        />
      </div>
    </div>
    <div class="home-right">
      <WorkerDetail
        :worker="selectedWorker"
        @update="handleUpdateWorker"
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
import {
  requestGetWorkerList,
  requestRemoveWorker,
  requestUpdateWorker,
  requestPauseAndRecoverWorker,
} from "@/api";
import { useApiCall } from "@/hooks/useApiCall";
import { WSConnection } from "@/ws/WSConnection";
import { WSMessage } from "@mp-assistant/common/dist/ws/index.js";
import { WorkerStatus } from "@mp-assistant/common/dist/work/const.js";
import type { BaseWorkerInfo } from "@mp-assistant/common/dist/work/BaseWorker.js";
import WorkerCard from "./component/WorkerCard/index.vue";
import WorkerDetail from "./component/WorkerDetail/index.vue";
import AddWorkerDialog from "./component/AddWorkerDialog/index.vue";

const workerList = ref<BaseWorkerInfo[]>([]);
const selectedKey = ref<string | null>(null);
const addWorkerDialog = ref<InstanceType<typeof AddWorkerDialog> | null>(null);

const selectedWorker = computed(() =>
  workerList.value.find((w) => w.key === selectedKey.value) ?? null
);

const fetchList = async () => {
  const { data } = await requestGetWorkerList();
  workerList.value = data;
};

const { call: updateWorker } = useApiCall(requestUpdateWorker);

const handleUpdateWorker = async (values: { name?: string; weight?: number }) => {
  if (!selectedKey.value) return;
  try {
    await updateWorker({ key: selectedKey.value, ...values });
    await fetchList();
    ElMessage.success("更新成功");
  } catch {}
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
  WSConnection.instance.on(WSMessage.Worker.DetailChange.type, () => {
    fetchList();
  });
});
</script>

<style scoped lang="scss">
@use "./index.scss";
</style>
