<template>
  <div class="worker-detail">
    <div class="detail-header">
      <div class="detail-header-main">
        <div class="detail-title">
          <span class="detail-name">{{ workerListItem.name }}</span>
          <el-tag type="info" size="small">{{ WorkerTypeDict[workerListItem.type] }}</el-tag>
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
        <div v-if="worker" class="detail-info">
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
          :type="currentStatus === WorkerStatus.RUNNING ? 'warning' : 'success'"
          @click="$emit('toggleSuspend')"
        >
          {{ currentStatus === WorkerStatus.PAUSED ? "恢复" : "暂停" }}
        </el-button>
        <el-button size="small" type="danger" @click="$emit('remove')">删除</el-button>
      </div>
    </div>

    <div class="detail-body" v-loading="refreshing">
      <div v-if="!worker" class="detail-body-empty">
        <el-empty :description="loading ? '加载中...' : '加载失败'" />
      </div>
      <div v-else-if="worker.taskList.length === 0" class="detail-body-empty">
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
            :worker-key="workerKey"
            @show-task="openTaskDialog"
            @audit="handleAudit"
            @changed="reload"
          />
        </div>

        <div class="detail-right">
          <div class="section-title">
            <span>任务列表</span>
            <el-button size="small" type="primary" @click="addTaskDialog?.open(workerKey)">添加任务</el-button>
          </div>
          <div class="task-filter">
            <el-select v-model="statusFilter" size="small" placeholder="状态筛选" style="width: 100%">
              <el-option v-for="opt in statusFilterOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
          </div>
          <div class="task-list">
            <WXTaskCard
              v-for="task in filteredTaskList"
              :key="task.key"
              :info="task"
              :active="selectedTaskKey === task.key"
              :wxa-list="worker.wxaList"
              :worker-key="workerKey"
              @select="openTaskDialog(task.key)"
              @changed="reload"
            />
            <div v-if="filteredTaskList.length === 0" class="task-list-empty">无匹配任务</div>
          </div>
        </div>
      </template>
    </div>

    <el-dialog v-model="dialogVisible" title="任务详情" width="600px" align-center @close="selectedTaskKey = null">
      <WXTaskDetail
        v-if="selectedTaskKey"
        :task-key="selectedTaskKey"
        :wxa-list="worker?.wxaList"
        :worker-key="workerKey"
        @removed="handleTaskRemoved"
        @changed="reload"
      />
    </el-dialog>

    <AddWXTaskDialog ref="addTaskDialog" :wxa-list="worker?.wxaList ?? []" @success="reload" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { ElMessage } from "element-plus";
import type { WorkerListItem } from "@mp-assistant/common/dist/work/BaseWorker.js";
import {
  TaskStatus,
  TaskStatusDict,
  WorkerStatus,
  WorkerStatusDict,
  WorkerTypeDict,
  WXTaskType
} from "@mp-assistant/common/dist/work/const.js";
import { requestAddTask, requestGetWorkerDetail } from "@/api";
import { useApiCall } from "@/hooks/useApiCall";
import { latestCall } from "@/utils/latestCall";
import { WSConnection } from "@/ws/WSConnection";
import { WSMessage } from "@mp-assistant/common/dist/ws/index.js";
import type { VersionPositioner } from "@mp-assistant/common/dist/utils/index.js";
import WXTaskCard from "@/component/WXTaskCard/index.vue";
import WXTaskDetail from "@/component/WXTaskDetail/index.vue";
import WxaVersionView from "./component/WxaVersionView/index.vue";
import AddWXTaskDialog from "@/component/AddWXTaskDialog/index.vue";

const props = defineProps<{
  workerKey: string;
  workerListItem: WorkerListItem;
}>();

defineEmits<{
  edit: [];
  toggleSuspend: [];
  remove: [];
}>();

const tabs = [{ key: "version", label: "版本视图" }];

const activeTab = ref("version");
const selectedTaskKey = ref<string | null>(null);
const dialogVisible = ref(false);
const addTaskDialog = ref<InstanceType<typeof AddWXTaskDialog> | null>(null);

const { call: fetchDetail, loading, data: worker } = useApiCall(() => requestGetWorkerDetail({ key: props.workerKey }));
// WS 通知触发的刷新用 latestCall 合并高频，保持静默
const refreshOnWs = latestCall(() => fetchDetail(), 1000);

// 用户操作触发的刷新带 loading，提升感知度；WS 通知触发的 refreshOnWs 保持静默
const refreshing = ref(false);

const reload = async () => {
  refreshing.value = true;
  try {
    await fetchDetail();
  } catch {
    // 请求失败已有统一提示
  } finally {
    refreshing.value = false;
  }
};

const handleDetailChange = (data: WSMessage.WorkerDetailChanged.Data) => {
  if (data.workerKey === props.workerKey) {
    refreshOnWs();
  }
};

onMounted(() => {
  reload();
  WSConnection.instance.on(WSMessage.WorkerDetailChanged.type, handleDetailChange);
});

onUnmounted(() => {
  WSConnection.instance.off(WSMessage.WorkerDetailChanged.type, handleDetailChange);
});

// worker 切换时刷新并重置任务选中
watch(
  () => props.workerKey,
  () => {
    selectedTaskKey.value = null;
    dialogVisible.value = false;
    reload();
  }
);

// 列表项（名称/权重/状态）变化后刷新详情，编辑/暂停后不等 WS 推送
watch(() => props.workerListItem, () => {
  reload();
});

const currentStatus = computed(() => worker.value?.status ?? props.workerListItem.status);

const statusLabel = computed(() => WorkerStatusDict[currentStatus.value] || currentStatus.value);

const statusTagType = computed(() => {
  switch (currentStatus.value) {
    case WorkerStatus.RUNNING:
      return "success";
    case WorkerStatus.PAUSED:
      return "warning";
    default:
      return "info";
  }
});

const statusFilter = ref("");
const statusFilterOptions = [
  { value: "", label: "全部" },
  { value: TaskStatus.IDLE, label: TaskStatusDict[TaskStatus.IDLE] },
  { value: TaskStatus.RUNNING, label: TaskStatusDict[TaskStatus.RUNNING] },
  { value: TaskStatus.COMPLETED, label: TaskStatusDict[TaskStatus.COMPLETED] },
  { value: TaskStatus.FAILED, label: TaskStatusDict[TaskStatus.FAILED] }
];

const filteredTaskList = computed(() => {
  if (!worker.value) return [];
  const list = statusFilter.value
    ? worker.value.taskList.filter(t => t.status === statusFilter.value)
    : worker.value.taskList;
  // 定时任务始终置顶（稳定排序，其余顺序保持不变）
  return [...list].sort((a, b) => (b.options.scheduled ? 1 : 0) - (a.options.scheduled ? 1 : 0));
});

const openTaskDialog = (taskKey: string) => {
  selectedTaskKey.value = taskKey;
  dialogVisible.value = true;
};

// 任务删除成功后关闭抽屉，并刷新任务列表
const handleTaskRemoved = () => {
  selectedTaskKey.value = null;
  dialogVisible.value = false;
  reload();
};

const handleAddLoginTask = async () => {
  try {
    await requestAddTask({
      key: props.workerKey,
      type: WXTaskType.WX_LOGIN,
      options: { action: "login" }
    });
    ElMessage.success("登录任务已添加");
    reload();
  } catch {}
};

const handleAudit = (payload: { appId: string; positioner: VersionPositioner[]; versionDescription: string }) => {
  // 打开添加任务弹窗并预填审核参数，其余信息（版本描述/图片/视频等）由用户在弹窗中补充
  addTaskDialog.value?.open(props.workerKey, {
    type: WXTaskType.WX_AUDIT,
    appId: payload.appId,
    positioners: payload.positioner,
  });
};

</script>

<style scoped lang="scss">
@use "./index.scss";
</style>
