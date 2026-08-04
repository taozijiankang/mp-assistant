<template>
  <div class="worker-card" :class="{ active }" @click="$emit('select')">
    <div class="worker-card-header">
      <span class="worker-card-name">{{ info.options.name }}</span>
      <el-tag :type="statusTagType" size="small">{{ statusLabel }}</el-tag>
    </div>
    <div class="worker-card-footer">
      <span class="worker-card-key">{{ info.key }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { BaseWorkerInfo } from "@mp-assistant/common/dist/work/BaseWorker.js";
import { WorkerStatus, WorkerStatusDict } from "@mp-assistant/common/dist/work/const.js";

const props = defineProps<{
  info: BaseWorkerInfo;
  active: boolean;
}>();

defineEmits<{
  select: [];
}>();

const statusLabel = computed(() => WorkerStatusDict[props.info.status] || props.info.status);

const statusTagType = computed(() => {
  switch (props.info.status) {
    case WorkerStatus.RUNNING: return "success";
    case WorkerStatus.PAUSED: return "warning";
    default: return "info";
  }
});
</script>

<style scoped lang="scss">
@use "./index.scss";
</style>
