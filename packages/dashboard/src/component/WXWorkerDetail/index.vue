<template>
  <div class="worker-detail">
    <template v-if="worker">
      <div class="detail-header">
        <div>
          <div class="detail-title">
            <span class="detail-name">{{ worker.options.name }}</span>
            <el-tag type="info" size="small">{{ WorkerTypeDict[worker.type] }}</el-tag>
            <el-tag :type="statusTagType" size="small">{{ statusLabel }}</el-tag>
          </div>
          <div class="detail-info">
            <span>权重 {{ worker.options.weight ?? '-' }}</span>
            <span>并发 {{ worker.options.syncTaskNum }}</span>
            <span>{{ worker.createdTime }}</span>
          </div>
        </div>
        <div class="detail-header-actions">
          <el-button size="small" @click="$emit('edit')">编辑</el-button>
          <el-button
            size="small"
            :type="worker.status === WorkerStatus.RUNNING ? 'warning' : 'success'"
            @click="$emit('toggleSuspend')"
          >
            {{ worker.status === WorkerStatus.PAUSED ? '恢复' : '暂停' }}
          </el-button>
          <el-button size="small" type="danger" @click="$emit('remove')">删除</el-button>
        </div>
      </div>

      <div class="detail-body">
        <div class="detail-left">
          <div v-if="worker.loginQRCode" class="detail-row qrcode-row">
            <span class="label">登录二维码</span>
            <img :src="worker.loginQRCode" class="qrcode-image" />
          </div>

          <div class="view-tabs">
            <span
              v-for="tab in tabs"
              :key="tab.key"
              class="tab-item"
              :class="{ active: activeTab === tab.key }"
              @click="activeTab = tab.key"
            >{{ tab.label }}</span>
          </div>
          <WxaVersionView v-if="activeTab === 'version'" :list="worker.wxaList" />
        </div>

        <div class="detail-right">
          <div class="section-title">
            <span>任务列表</span>
            <el-button size="small" type="primary" @click="addTaskDialog?.open(worker.key)">添加任务</el-button>
          </div>
          <div v-if="worker.taskList.length > 0" class="task-list">
            <WXTaskCard
              v-for="task in worker.taskList"
              :key="task.key"
              :info="task"
              :active="selectedTaskKey === task.key"
              :wxa-list="worker.wxaList"
              @select="openTaskDrawer(task.key)"
            />
          </div>
          <div v-else class="task-empty">暂无任务</div>
        </div>
      </div>

      <el-drawer v-model="drawerVisible" title="任务详情" size="400px" @close="selectedTaskKey = null">
        <WXTaskDetail
          v-if="selectedTask"
          :task="selectedTask"
          :wxa-list="worker.wxaList"
          @abort="handleAbortTask"
          @reset="handleResetTask"
          @remove="handleRemoveTask"
        />
      </el-drawer>
    </template>

    <div v-else class="detail-empty">
      <span>请选择一个 Worker</span>
    </div>

    <AddWXTaskDialog ref="addTaskDialog" :wxa-list="worker?.wxaList ?? []" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import type { WXWorkerInfo } from "@mp-assistant/common/dist/work/wx/WXWorker.js";
import { WorkerStatus, WorkerStatusDict, WorkerTypeDict, WXTaskTypeDict } from "@mp-assistant/common/dist/work/const.js";
import { requestRemoveTask, requestAbortTask, requestResetTaskStatus } from "@/api";
import { useApiCall } from "@/hooks/useApiCall";
import WXTaskCard from "@/component/WXTaskCard/index.vue";
import WXTaskDetail from "@/component/WXTaskDetail/index.vue";
import WxaVersionView from "./component/WxaVersionView.vue";
import AddWXTaskDialog from "@/component/AddWXTaskDialog/index.vue";

const props = defineProps<{
  worker: WXWorkerInfo | null;
}>();

defineEmits<{
  edit: [];
  toggleSuspend: [];
  remove: [];
}>();

const tabs = [
  { key: 'version', label: '版本视图' },
];

const activeTab = ref('version');
const selectedTaskKey = ref<string | null>(null);
const drawerVisible = ref(false);
const addTaskDialog = ref<InstanceType<typeof AddWXTaskDialog> | null>(null);

const selectedTask = computed(() =>
  props.worker?.taskList.find((t) => t.key === selectedTaskKey.value) ?? null
);

const openTaskDrawer = (taskKey: string) => {
  selectedTaskKey.value = taskKey;
  drawerVisible.value = true;
};

// worker 变化时重置任务选中
watch(() => props.worker?.key, () => {
  selectedTaskKey.value = null;
  drawerVisible.value = false;
});

const statusLabel = computed(() => {
  if (!props.worker) return "";
  return WorkerStatusDict[props.worker.status] || props.worker.status;
});

const statusTagType = computed(() => {
  if (!props.worker) return "info";
  switch (props.worker.status) {
    case WorkerStatus.RUNNING: return "success";
    case WorkerStatus.PAUSED: return "warning";
    default: return "info";
  }
});

const { call: removeTask } = useApiCall(requestRemoveTask);

const handleRemoveTask = async () => {
  if (!props.worker || !selectedTask.value) return;
  await ElMessageBox.confirm(`确定删除 "${WXTaskTypeDict[selectedTask.value.type]}" 吗？`, "删除确认", {
    type: "warning",
  });
  try {
    await removeTask({ key: props.worker.key, taskKey: selectedTask.value.key });
    selectedTaskKey.value = null;
    drawerVisible.value = false;
    ElMessage.success("删除成功");
  } catch {}
};

const { call: abortTask } = useApiCall(requestAbortTask);

const handleAbortTask = async () => {
  if (!props.worker || !selectedTask.value) return;
  try {
    await abortTask({ key: props.worker.key, taskKey: selectedTask.value.key });
    ElMessage.success("已终止");
  } catch {}
};

const { call: resetTask } = useApiCall(requestResetTaskStatus);

const handleResetTask = async () => {
  if (!props.worker || !selectedTask.value) return;
  try {
    await resetTask({ key: props.worker.key, taskKey: selectedTask.value.key });
    ElMessage.success("已重置");
  } catch {}
};
</script>

<style scoped lang="scss">
@use "./index.scss";
</style>
