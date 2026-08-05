<template>
  <div class="task-card" :class="{ active }" @click="$emit('select')">
    <div class="task-name">{{ WXTaskTypeDict[info.type] }}</div>
    <div class="task-meta">
      <el-tag size="small" type="info">{{ WXTaskTypeDict[info.type] }}</el-tag>
      <el-tag size="small" :type="statusTagType">{{ TaskStatusDict[info.status] }}</el-tag>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { BaseTaskInfo } from "@mp-assistant/common/dist/work/BaseTask.js";
import { TaskStatus, TaskStatusDict, WXTaskTypeDict } from "@mp-assistant/common/dist/work/const.js";

const props = defineProps<{
  info: BaseTaskInfo;
  active: boolean;
}>();

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
