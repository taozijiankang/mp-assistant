<template>
  <div class="worker-detail">
    <template v-if="worker">
      <div class="detail-header">
        <div class="detail-title">
          <span class="detail-name">{{ worker.options.name }}</span>
          <el-tag :type="statusTagType" size="small">{{ statusLabel }}</el-tag>
        </div>
        <span class="detail-key">{{ worker.key }}</span>
      </div>

      <div class="detail-body">
        <div class="detail-section">
          <div class="section-title">Worker 信息</div>
          <div class="detail-row">
            <span class="label">名称</span>
            <span>{{ worker.options.name }}</span>
          </div>
          <div class="detail-row">
            <span class="label">权重</span>
            <span>{{ worker.options.weight ?? '-' }}</span>
          </div>
          <div class="detail-row">
            <span class="label">并发任务数</span>
            <span>{{ worker.options.syncTaskNum }}</span>
          </div>
          <div class="detail-row">
            <span class="label">创建时间</span>
            <span>{{ worker.createdTime }}</span>
          </div>
          <div v-if="worker.loginQRCode" class="detail-row qrcode-row">
            <span class="label">登录二维码</span>
            <img :src="worker.loginQRCode" class="qrcode-image" />
          </div>
          <div v-if="worker.wxaList && worker.wxaList.length > 0" class="wxa-section">
            <div class="section-title">小程序列表 ({{ worker.wxaList.length }})</div>
            <div class="wxa-list">
              <div v-for="item in worker.wxaList" :key="item.appid" class="wxa-item">
                <div class="wxa-item-header">
                  <img :src="item.app_headimg" class="wxa-avatar" />
                  <span class="wxa-name">{{ item.app_name }}</span>
                </div>
                <div v-if="item.versionData" class="wxa-version">
                  <div v-if="item.versionData.online_info?.basic_info" class="version-tag online">
                    线上 v{{ item.versionData.online_info.basic_info.version }}
                  </div>
                  <div v-if="item.versionData.experience_info?.basic_info" class="version-tag experience">
                    体验 v{{ item.versionData.experience_info.basic_info.version }}
                  </div>
                  <div
                    v-for="dev in item.versionData.develop_info?.info_list"
                    :key="dev.basic_info.open_id"
                    class="version-tag develop"
                  >
                    {{ dev.basic_info.nick_name }} v{{ dev.basic_info.version }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="detail-section task-section">
          <div class="section-title">
            <span>任务列表</span>
            <el-button size="small" type="primary" @click="addTaskDialog?.open(worker.key)">添加任务</el-button>
          </div>
          <div v-if="worker.taskList.length > 0" class="task-area">
            <div class="task-left">
              <WXTaskCard
                v-for="task in worker.taskList"
                :key="task.key"
                :info="task"
                :active="selectedTaskKey === task.key"
                @select="selectedTaskKey = task.key"
              />
            </div>
            <div class="task-right">
              <WXTaskDetail
                :task="selectedTask"
                @abort="handleAbortTask"
                @reset="handleResetTask"
                @remove="handleRemoveTask"
              />
            </div>
          </div>
          <div v-else class="task-empty">暂无任务</div>
        </div>
      </div>

      <div class="detail-actions">
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
import { WorkerStatus, WorkerStatusDict, WXTaskTypeDict } from "@mp-assistant/common/dist/work/const.js";
import { requestRemoveTask, requestAbortTask, requestResetTaskStatus } from "@/api";
import { useApiCall } from "@/hooks/useApiCall";
import WXTaskCard from "@/component/WXTaskCard/index.vue";
import WXTaskDetail from "@/component/WXTaskDetail/index.vue";
import AddWXTaskDialog from "@/component/AddWXTaskDialog/index.vue";

const props = defineProps<{
  worker: WXWorkerInfo | null;
}>();

defineEmits<{
  edit: [];
  toggleSuspend: [];
  remove: [];
}>();

const selectedTaskKey = ref<string | null>(null);
const addTaskDialog = ref<InstanceType<typeof AddWXTaskDialog> | null>(null);

const selectedTask = computed(() =>
  props.worker?.taskList.find((t) => t.key === selectedTaskKey.value) ?? null
);

// worker 变化时重置任务选中
watch(() => props.worker?.key, () => {
  selectedTaskKey.value = null;
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
