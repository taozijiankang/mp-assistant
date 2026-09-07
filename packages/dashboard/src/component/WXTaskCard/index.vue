<template>
  <div class="task-card" :class="{ active }" @click="$emit('select')">
    <div class="task-card-header">
      <span class="task-name">{{ WXTaskTypeDict[info.type] }}</span>
      <div class="task-card-header-right">
        <el-tag size="small" :type="statusTagType">{{ TaskStatusDict[info.status] }}</el-tag>
        <el-button
          v-if="info.status === TaskStatus.RUNNING"
          size="small"
          type="danger"
          plain
          @click.stop="$emit('abort')"
        >
          终止
        </el-button>
        <el-button
          v-if="info.status === TaskStatus.FAILED"
          size="small"
          type="warning"
          plain
          @click.stop="$emit('reset')"
        >
          重置
        </el-button>
      </div>
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
      <span v-if="publishInfo.publishCountdown != null" class="task-publish-countdown">
        {{ formatCountdown(publishInfo.publishCountdown) }}
      </span>
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
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { BaseTaskInfo } from "@mp-assistant/common/dist/work/BaseTask.js";
import type { WXPublishTaskInfo } from "@mp-assistant/common/dist/work/wx/tasks/WXPublishTask.js";
import type { WXMPItem } from "@mp-assistant/common/dist/types/wx.js";
import { TaskStatus, TaskStatusDict, WXTaskTypeDict, WXTaskType } from "@mp-assistant/common/dist/work/const.js";

const props = defineProps<{
  info: BaseTaskInfo;
  active: boolean;
  wxaList?: WXMPItem[];
}>();

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

const latestReport = computed(() => {
  const reports = props.info.reports ?? [];
  return reports.length > 0 ? reports[reports.length - 1] : null;
});

const formatCountdown = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

defineEmits<{
  select: [];
  abort: [];
  reset: [];
}>();

const statusTagType = computed(() => {
  switch (props.info.status) {
    case TaskStatus.RUNNING: return "warning";
    case TaskStatus.COMPLETED: return "success";
    case TaskStatus.FAILED: return "danger";
    default: return "info";
  }
});
</script>

<style scoped lang="scss">
@use "./index.scss";
</style>
