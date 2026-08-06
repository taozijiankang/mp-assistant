<template>
  <div class="task-card" :class="{ active }" @click="$emit('select')">
    <div class="task-card-header">
      <span class="task-name">{{ WXTaskTypeDict[info.type] }}</span>
      <el-tag size="small" :type="statusTagType">{{ TaskStatusDict[info.status] }}</el-tag>
    </div>
    <div v-if="info.type === WXTaskType.WX_LOGIN" class="task-option" :class="(info.options as any).action">
      {{ (info.options as any).action === 'logout' ? '退出登录' : '登录' }}
    </div>
    <div v-if="info.type === WXTaskType.WX_INSPECT_VERSION" class="task-option">
      <img v-if="wxaItem" :src="wxaItem.app_headimg" class="task-app-avatar" />
      <span>{{ wxaItem ? wxaItem.app_name : (info.options as any).appId }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { BaseTaskInfo } from "@mp-assistant/common/dist/work/BaseTask.js";
import type { WXMPItem } from "@mp-assistant/common/dist/types/wx.js";
import { TaskStatus, TaskStatusDict, WXTaskTypeDict, WXTaskType } from "@mp-assistant/common/dist/work/const.js";

const props = defineProps<{
  info: BaseTaskInfo;
  active: boolean;
  wxaList?: WXMPItem[];
}>();

const wxaItem = computed(() => {
  if (props.info.type !== WXTaskType.WX_INSPECT_VERSION) return null;
  const appId = (props.info.options as any).appId as string;
  return props.wxaList?.find(item => item.appid === appId) ?? null;
});

defineEmits<{
  select: [];
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
