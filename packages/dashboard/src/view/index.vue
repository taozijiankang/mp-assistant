<template>
  <div class="app-container">
    <div class="header">
      <div class="header-title">
        <img src="@/assets/logo.png" alt="小程序助手" class="header-title-logo" />
        <span class="header-title-text">小程序助手 控制台 </span>
        <span class="header-title-text">v{{ packageInfo.version }}</span>
      </div>
      <el-button type="primary" @click="handleEditConfig" plain :icon="Setting"></el-button>
    </div>
    <div class="content">
      <WorkList class="worker-list" :currentWorkerKey="currentWorkerKey"
        @currentWorkerKeyChange="handleCurrentWorkerKeyChange" />
      <WorkerDetail class="worker-detail" :workerKey="currentWorkerKey" />
    </div>
    <EditConfigDialog ref="editConfigDialogRef" />
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import WorkList from '@/component/WorkList/index.vue';
import EditConfigDialog from '@/component/EditConfigDialog/index.vue';
import WorkerDetail from '@/component/WorkerDetail/index.vue';
import { useOperationRecordStore } from '@/stores';
import { storeToRefs } from 'pinia';
import { Setting } from '@element-plus/icons-vue';

const packageInfo = __PACKAGE_INFO__;

const editConfigDialogRef = ref<InstanceType<typeof EditConfigDialog>>();

const operationRecordStore = useOperationRecordStore();
const { currentWorkerKey } = storeToRefs(operationRecordStore);

const handleEditConfig = () => {
  editConfigDialogRef.value?.open();
};

const handleCurrentWorkerKeyChange = (key: string) => {
  operationRecordStore.setCurrentWorkerKey(key);
};
</script>

<style scoped lang="scss">
@use "./index.scss";
</style>