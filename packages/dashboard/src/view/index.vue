<template>
  <div class="app-container">
    <div class="header">
      <div class="header-title">
        <img src="@/assets/logo.png" alt="小程序助手" class="header-title-logo" />
        <span class="header-title-text">小程序助手 控制台</span>
      </div>
      <el-button type="primary" @click="handleEditConfig" plain :icon="Setting"></el-button>
    </div>
    <div class="worker-list">
      <WorkList :currentWorkerKey="currentWorkerKey" @currentWorkerKeyChange="handleCurrentWorkerKeyChange" />
    </div>
    <WorkerDetail class="worker-detail" :workerKey="currentWorkerKey" />
    <EditConfigDialog ref="editConfigDialogRef" />
  </div>
</template>
<script setup lang="ts">
import { onMounted, ref } from 'vue';
import WorkList from '@/component/WorkList/index.vue';
import EditConfigDialog from '@/component/EditConfigDialog/index.vue';
import WorkerDetail from '@/component/WorkerDetail/index.vue';
import { useOperationRecordStore } from '@/stores';
import { storeToRefs } from 'pinia';
import { Setting } from '@element-plus/icons-vue';
import { requestGetConfig } from '@/api/modules/config';

const editConfigDialogRef = ref<InstanceType<typeof EditConfigDialog>>();

const operationRecordStore = useOperationRecordStore();
const { currentWorkerKey } = storeToRefs(operationRecordStore);

const handleEditConfig = () => {
  editConfigDialogRef.value?.open();
};

const handleCurrentWorkerKeyChange = (key: string) => {
  operationRecordStore.setCurrentWorkerKey(key);
};

onMounted(async () => {
  const { data: config } = await requestGetConfig();
  if (!config.executablePath) {
    editConfigDialogRef.value?.open(true);
  }
});
</script>

<style scoped lang="scss">
@use "./index.scss";
</style>