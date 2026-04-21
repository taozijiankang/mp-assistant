<template>
  <div class="home-page">
    <WorkList class="worker-list" :currentWorkerKey="currentWorkerKey"
      @currentWorkerKeyChange="handleCurrentWorkerKeyChange" />
    <WorkerDetail class="worker-detail" :workerKey="currentWorkerKey" />
  </div>
</template>

<script setup lang="ts">
import WorkList from './component/WorkList/index.vue';
import WorkerDetail from './component/WorkerDetail/index.vue';
import { useOperationRecordStore } from '@/stores';
import { storeToRefs } from 'pinia';

const operationRecordStore = useOperationRecordStore();
const { currentWorkerKey } = storeToRefs(operationRecordStore);

const handleCurrentWorkerKeyChange = (key: string) => {
  operationRecordStore.setCurrentWorkerKey(key);
};
</script>

<style scoped lang="scss">
@use "./index.scss";
</style>
