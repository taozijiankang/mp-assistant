<template>
  <div class="app-container">
    <div class="header">
      <span>MP Assistant Dashboard</span>
    </div>
    <div class="content">
      <div class="left">
        <div class="left-header">
          <span>workers</span>
          <el-button type="primary" @click="addWorker">add</el-button>
        </div>
        <div class="left-content">
          <div class="left-content-item" v-for="item in workers" :key="item.key"
            :class="{ 'selected': selectedWorkerKey === item.key }" @click="selectedWorkerKey = item.key">
            <span>{{ item.name }}</span>
            <span>{{ item.type }}</span>
            <el-button type="danger" @click="removeWorker(item.key)">remove</el-button>
          </div>
        </div>
      </div>
      <div class="center">
        <WXWorkerDetail v-if="selectedWorker && isWXWorkerInfo(selectedWorker)" :worker="selectedWorker" />
      </div>
    </div>
    <AddWorkerDialog ref="addWorkerDialogRef" @onAddWorker="getWorkers" />
  </div>
</template>
<script setup lang="ts">
import { requestGetWorkerInfos, requestRemoveWorker } from '@/api/worker';
import type { BaseWorkInfo } from 'mp-assistant-common/dist/work/type';
import { ref, onMounted, computed } from 'vue';
import AddWorkerDialog from '@/component/AddWorkerDialog/index.vue';
import { ElMessageBox } from 'element-plus';
import WXWorkerDetail from '@/component/WXWorkerDetail/index.vue';
import { isWXWorkerInfo } from 'mp-assistant-common/dist/work/index.js';

const addWorkerDialogRef = ref<InstanceType<typeof AddWorkerDialog>>();

const workers = ref<BaseWorkInfo[]>([]);

const selectedWorkerKey = ref<string>('');

const selectedWorker = computed(() => {
  return workers.value.find(item => item.key === selectedWorkerKey.value);
});

const getWorkers = async () => {
  const { data } = await requestGetWorkerInfos();
  workers.value = data;
  if (!selectedWorker.value) {
    selectedWorkerKey.value = data[0]?.key ?? '';
  }
}

const addWorker = () => {
  addWorkerDialogRef.value?.open();
}

const removeWorker = async (key: string) => {
  ElMessageBox.confirm('Are you sure to remove this worker?', 'Confirm', {
    confirmButtonText: 'Confirm',
    cancelButtonText: 'Cancel',
    type: 'warning',
  })
    .then(async () => {
      await requestRemoveWorker(key);
      getWorkers();
    });
}

onMounted(() => {
  getWorkers();
});
</script>

<style scoped lang="scss">
@import "./index.scss";
</style>