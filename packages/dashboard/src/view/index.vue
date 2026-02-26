<template>
  <div class="app-container">
    <div class="header">
      <span>小程序助手 控制台</span>
      <el-button type="primary" @click="handleEditConfig">编辑配置</el-button>
    </div>
    <div class="worker-list">
      <WorkList :currentWorkerKey="currentWorkerKey" @onWorkerItemClick="handleWorkerItemClick" />
    </div>
    <WorkerDetail class="worker-detail" :workerKey="currentWorkerKey" />
    <EditConfigDialog ref="editConfigDialogRef" />
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import WorkList from '@/component/WorkList/index.vue';
import EditConfigDialog from '@/component/EditConfigDialog/index.vue';
import WorkerDetail from '@/component/WorkerDetail/index.vue';
import type { BaseWorkInfo } from 'mp-assistant-common/dist/work';

const editConfigDialogRef = ref<InstanceType<typeof EditConfigDialog>>();

const currentWorkerKey = ref('');

const handleEditConfig = () => {
  editConfigDialogRef.value?.open();
};

const handleWorkerItemClick = (workerItem: BaseWorkInfo) => {
  currentWorkerKey.value = workerItem.key;
};
</script>

<style scoped lang="scss">
@use "./index.scss";
</style>