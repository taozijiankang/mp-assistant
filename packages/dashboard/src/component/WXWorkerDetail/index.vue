<template>
  <div class="worker-detail">
    <div class="detail-header">
      <div class="detail-header-main">
        <div class="detail-title">
          <span class="detail-name">{{ worker.options.name }}</span>
          <el-tag type="info" size="small">{{ WorkerTypeDict[worker.type] }}</el-tag>
          <el-tag :type="statusTagType" size="small">{{ statusLabel }}</el-tag>
          <span class="title-sep"></span>
          <span
            v-for="tab in tabs"
            :key="tab.key"
            class="tab-item"
            :class="{ active: activeTab === tab.key }"
            @click="activeTab = tab.key"
          >
            {{ tab.label }}
          </span>
        </div>
        <div class="detail-info">
          <span>调试端口 {{ worker.debugPort ?? "-" }}</span>
          <span>权重 {{ worker.options.weight ?? "-" }}</span>
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
          {{ worker.status === WorkerStatus.PAUSED ? "恢复" : "暂停" }}
        </el-button>
        <el-button size="small" type="danger" @click="$emit('remove')">删除</el-button>
      </div>
    </div>

    <div class="detail-body">
      <div v-if="worker.taskList.length === 0" class="detail-body-empty">
        <el-empty description="暂无任务">
          <el-button type="primary" size="small" @click="handleAddLoginTask">登录</el-button>
        </el-empty>
      </div>
      <template v-else>
        <div class="detail-left">
          <div v-if="worker.loginQRCode" class="detail-row qrcode-row">
            <span class="label">登录二维码</span>
            <img :src="worker.loginQRCode" class="qrcode-image" />
          </div>
          <WxaVersionView
            v-if="activeTab === 'version'"
            :list="worker.wxaList"
            @fetch-version="handleFetchVersion"
            @show-task="openTaskDrawer"
            @audit="handleAudit"
            @publish="handlePublish"
          />
        </div>

        <div class="detail-right">
          <div class="section-title">
            <span>任务列表</span>
            <el-button size="small" type="primary" @click="addTaskDialog?.open(worker.key)">添加任务</el-button>
          </div>
          <div class="task-list">
            <WXTaskCard
              v-for="task in worker.taskList"
              :key="task.key"
              :info="task"
              :active="selectedTaskKey === task.key"
              :wxa-list="worker.wxaList"
              @select="openTaskDrawer(task.key)"
              @abort="handleAbortTask(task.key)"
              @reset="handleResetTask(task.key)"
            />
          </div>
        </div>
      </template>
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

    <AddWXTaskDialog ref="addTaskDialog" :wxa-list="worker.wxaList ?? []" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import type { WXWorkerInfo } from "@mp-assistant/common/dist/work/wx/WXWorker.js";
import {
  WorkerStatus,
  WorkerStatusDict,
  WorkerTypeDict,
  WXTaskTypeDict,
  WXTaskType
} from "@mp-assistant/common/dist/work/const.js";
import { requestRemoveTask, requestAbortTask, requestResetTaskStatus, requestAddTask } from "@/api";
import type { VersionPositioner } from "@mp-assistant/common/dist/utils/index.js";
import { useApiCall } from "@/hooks/useApiCall";
import WXTaskCard from "@/component/WXTaskCard/index.vue";
import WXTaskDetail from "@/component/WXTaskDetail/index.vue";
import WxaVersionView from "./component/WxaVersionView/index.vue";
import AddWXTaskDialog from "@/component/AddWXTaskDialog/index.vue";

const props = defineProps<{
  worker: WXWorkerInfo;
}>();

defineEmits<{
  edit: [];
  toggleSuspend: [];
  remove: [];
}>();

const tabs = [{ key: "version", label: "版本视图" }];

const activeTab = ref("version");
const selectedTaskKey = ref<string | null>(null);
const drawerVisible = ref(false);
const addTaskDialog = ref<InstanceType<typeof AddWXTaskDialog> | null>(null);

const selectedTask = computed(() => props.worker.taskList.find(t => t.key === selectedTaskKey.value) ?? null);

const openTaskDrawer = (taskKey: string) => {
  selectedTaskKey.value = taskKey;
  drawerVisible.value = true;
};

// worker 变化时重置任务选中
watch(
  () => props.worker.key,
  () => {
    selectedTaskKey.value = null;
    drawerVisible.value = false;
  }
);

const statusLabel = computed(() => WorkerStatusDict[props.worker.status] || props.worker.status);

const statusTagType = computed(() => {
  switch (props.worker.status) {
    case WorkerStatus.RUNNING:
      return "success";
    case WorkerStatus.PAUSED:
      return "warning";
    default:
      return "info";
  }
});

const { call: removeTask } = useApiCall(requestRemoveTask);

const handleRemoveTask = async () => {
  if (!selectedTask.value) return;
  await ElMessageBox.confirm(`确定删除 "${WXTaskTypeDict[selectedTask.value.type]}" 吗？`, "删除确认", {
    type: "warning"
  });
  try {
    await removeTask({ key: props.worker.key, taskKey: selectedTask.value.key });
    selectedTaskKey.value = null;
    drawerVisible.value = false;
    ElMessage.success("删除成功");
  } catch {}
};

const { call: abortTask } = useApiCall(requestAbortTask);

const handleAbortTask = async (taskKey?: string) => {
  const key = taskKey ?? selectedTask.value?.key;
  if (!key) return;
  try {
    await abortTask({ key: props.worker.key, taskKey: key });
    ElMessage.success("已终止");
  } catch {}
};

const handleAddLoginTask = async () => {
  try {
    await requestAddTask({
      key: props.worker.key,
      type: WXTaskType.WX_LOGIN,
      options: { action: "login" }
    });
    ElMessage.success("登录任务已添加");
  } catch {}
};

const handleFetchVersion = async (appId: string) => {
  try {
    await requestAddTask({
      key: props.worker.key,
      type: WXTaskType.WX_INSPECT_VERSION,
      options: { appId }
    });
    ElMessage.success("版本获取任务已添加");
  } catch {}
};

const handleAudit = (payload: { appId: string; positioner: VersionPositioner[]; versionDescription: string }) => {
  // 打开添加任务弹窗并预填审核参数，其余信息（版本描述/图片/视频等）由用户在弹窗中补充
  addTaskDialog.value?.open(props.worker.key, {
    type: WXTaskType.WX_AUDIT,
    appId: payload.appId,
    positioners: payload.positioner,
  });
};

const handlePublish = async (payload: { appId: string; positioner: VersionPositioner[] }) => {
  try {
    await requestAddTask({
      key: props.worker.key,
      type: WXTaskType.WX_PUBLISH,
      options: { appId: payload.appId, positioner: payload.positioner },
    });
    ElMessage.success("发布任务已添加");
  } catch {}
};

const { call: resetTask } = useApiCall(requestResetTaskStatus);

const handleResetTask = async (taskKey?: string) => {
  const key = taskKey ?? selectedTask.value?.key;
  if (!key) return;
  try {
    await resetTask({ key: props.worker.key, taskKey: key });
    ElMessage.success("已重置");
  } catch {}
};
</script>

<style scoped lang="scss">
@use "./index.scss";
</style>
