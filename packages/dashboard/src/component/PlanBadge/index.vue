<template>
  <span v-if="planStore.plannedAppids[appid]" class="plan-badge">计划中</span>
</template>

<script setup lang="ts">
import { usePlanStore } from "@/stores/plan";

defineProps<{ appid: string }>();
const planStore = usePlanStore();
</script>

<style scoped lang="scss">
.plan-badge {
  display: inline-block;
  font-size: 11px;
  line-height: 1;
  padding: 2px 6px;
  border-radius: 4px;
  background: #ecf5ff;
  color: #409eff;
  white-space: nowrap;
  margin: 2px 0;
}
</style>
