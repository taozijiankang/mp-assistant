<template>
    <div class="worker-list">
        <div class="content-scroll-container">
            <div class="content-container">
                <div class="worker-item" :class="{
                    selected: worker.key === currentWorkerKey
                }" v-for="worker in workerList" :key="worker.key" @click="handleWorkerItemClick(worker)">
                    {{ worker.name || '未命名' }}
                </div>
            </div>
        </div>
        <div class="controller">
            <el-button type="primary" @click="handleAddWorker">添加Worker</el-button>
        </div>
        <AddWorkerDialog ref="addWorkerDialogRef" @onAddWorker="getWorkerList" />
    </div>
</template>

<script setup lang="ts">
import type { BaseWorkInfo } from 'mp-assistant-common/dist/work/type';
import { onMounted, ref } from 'vue';
import { requestGetWorkerList } from '@/api';
import AddWorkerDialog from '@/component/AddWorkerDialog/index.vue';

const props = defineProps<{
    currentWorkerKey: string;
}>();

const emit = defineEmits<{
    (e: 'onWorkerItemClick', worker: BaseWorkInfo): void;
}>();

const addWorkerDialogRef = ref<InstanceType<typeof AddWorkerDialog>>();

const workerList = ref<BaseWorkInfo[]>([]);

const getWorkerList = async () => {
    const { data } = await requestGetWorkerList();
    workerList.value = data;

    if (!props.currentWorkerKey) {
        emit('onWorkerItemClick', data[0]);
    }
}

const handleWorkerItemClick = (item: BaseWorkInfo) => {
    emit('onWorkerItemClick', item);
}

const handleAddWorker = () => {
    addWorkerDialogRef.value?.open();
}

onMounted(() => {
    getWorkerList();
});
</script>

<style scoped lang="scss">
@use "./index.scss";
</style>