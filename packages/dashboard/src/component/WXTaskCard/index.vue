<template>
  <div class="task-card" :class="{ active }" @click="$emit('select')">
    <div class="task-card-header">
      <div class="task-card-title">
        <span class="task-name">{{ WXTaskTypeDict[info.type] }}</span>
        <span v-if="info.options.scheduled" class="task-scheduled-badge">
          <el-icon class="task-scheduled-badge-icon"><Timer /></el-icon>
          <span>定时</span>
        </span>
      </div>
      <el-tag size="small" :type="statusTagType">{{ TaskStatusDict[info.status] }}</el-tag>
    </div>
    <div v-if="info.type === WXTaskType.WX_LOGIN" class="task-option" :class="(info.options as any).action">
      {{ (info.options as any).action === 'logout' ? '退出登录' : '登录' }}
    </div>
    <div v-if="showWxaInfo" class="task-option">
      <img v-if="wxaItem" :src="wxaItem.app_headimg" class="task-app-avatar" />
      <span>{{ wxaItem ? wxaItem.app_name : (info.options as any).appId }}</span>
    </div>
    <div
      v-if="publishInfo && info.status === TaskStatus.RUNNING && publishInfo.publishQRCode"
      class="task-publish"
    >
      <img :src="publishInfo.publishQRCode" class="task-publish-qrcode" />
    </div>
    <div v-if="info.status === TaskStatus.RUNNING && latestReport" class="task-latest-report">
      <span v-if="latestReport.type === 'text'" class="task-latest-report-text">{{ latestReport.message }}</span>
      <el-image
        v-else
        :src="latestReport.message"
        :preview-src-list="[latestReport.message]"
        fit="contain"
        class="task-latest-report-image"
      />
    </div>
    <div v-if="info.status === TaskStatus.FAILED && info.completedMessage" class="task-fail-reason">
      {{ info.completedMessage }}
    </div>
    <div v-if="info.options.scheduled" class="task-schedule">
      <template v-if="scheduleCountdown != null">
        <span class="task-schedule-countdown">{{ formatCountdown(scheduleCountdown) }}</span>
        <span>后重跑</span>
      </template>
      <span v-else>定时任务</span>
    </div>
    <div class="task-card-actions">
      <el-button
        v-if="info.status === TaskStatus.RUNNING"
        size="small"
        type="warning"
        :loading="abortLoading"
        @click.stop="handleAbort"
      >
        终止
      </el-button>
      <el-button
        v-if="info.status === TaskStatus.FAILED"
        size="small"
        type="primary"
        :loading="resetLoading"
        @click.stop="handleReset"
      >
        重新运行
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { ElMessage } from "element-plus";
import { Timer } from "@element-plus/icons-vue";
import type { WXTaskSummary } from "@mp-assistant/common/dist/work/wx/WXTask.js";
import type { WXPublishTaskInfo } from "@mp-assistant/common/dist/work/wx/tasks/WXPublishTask.js";
import type { WXMPItem } from "@mp-assistant/common/dist/types/wx.js";
import { TaskStatus, TaskStatusDict, WXTaskTypeDict, WXTaskType } from "@mp-assistant/common/dist/work/const.js";
import { requestAbortTask, requestResetTaskStatus } from "@/api";
import { useApiCall } from "@/hooks/useApiCall";
import { useScheduleCountdown } from "@/hooks/useScheduleCountdown";

const props = defineProps<{
  info: WXTaskSummary;
  active: boolean;
  wxaList?: WXMPItem[];
  workerKey: string;
}>();

const emit = defineEmits<{
  select: [];
  changed: [];
}>();

const { call: abortTask, loading: abortLoading } = useApiCall(requestAbortTask);
const { call: resetTask, loading: resetLoading } = useApiCall(requestResetTaskStatus);

const handleAbort = async () => {
  try {
    await abortTask({ key: props.workerKey, taskKey: props.info.key });
    ElMessage.success("已终止");
    emit("changed");
  } catch {}
};

const handleReset = async () => {
  try {
    await resetTask({ key: props.workerKey, taskKey: props.info.key });
    ElMessage.success("任务已重新运行");
    emit("changed");
  } catch {}
};

// 需要展示小程序信息的任务类型：检查版本 / 审核 / 发布
const showWxaInfo = computed(() =>
  [WXTaskType.WX_INSPECT_VERSION, WXTaskType.WX_AUDIT, WXTaskType.WX_PUBLISH].includes(props.info.type as WXTaskType)
);

const wxaItem = computed(() => {
  if (!showWxaInfo.value) return null;
  const appId = (props.info.options as any).appId as string;
  return props.wxaList?.find(item => item.appid === appId) ?? null;
});

const publishInfo = computed<WXPublishTaskInfo | null>(() =>
  props.info.type === WXTaskType.WX_PUBLISH ? (props.info as WXPublishTaskInfo) : null
);

const latestReport = computed(() => props.info.lastReport ?? null);

const statusTagType = computed(() => {
  switch (props.info.status) {
    case TaskStatus.RUNNING: return "warning";
    case TaskStatus.COMPLETED: return "success";
    case TaskStatus.FAILED: return "danger";
    default: return "info";
  }
});

const scheduleCountdown = useScheduleCountdown(() => props.info);

const formatCountdown = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};
</script>

<style scoped lang="scss">
@use "./index.scss";
</style>
