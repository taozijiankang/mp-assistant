<template>
    <div class="worker-list">
        <el-tabs :model-value="currentWorkerKey" type="card" editable class="content-scroll-container"
            @edit="handleTabsEdit" @tab-add="handleAddWorker" @tab-click="handleWorkerItemClick"
            @tab-remove="handleTabRemove">
            <el-tab-pane v-for="worker in workerList" :key="worker.key" :label="worker.name" :name="worker.key">
            </el-tab-pane>
        </el-tabs>

        <AddWorkerDialog ref="addWorkerDialogRef" />
    </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { requestGetWorkerList, requestPauseWorker, requestRemoveWorker } from '@/api';
import AddWorkerDialog from '@/component/AddWorkerDialog/index.vue';
import { WSMessage } from "@mp-assistant/common/dist/ws/message.js"
import { WSMessageEvent } from '@/event/WSMessageEvent';
import type { BaseWorkInfo } from '@mp-assistant/common/dist/work';
import type { TabPaneName, TabsPaneContext } from 'element-plus';
import { TaskStatus } from '@mp-assistant/common/dist/work/task';
import { ElMessage } from 'element-plus';

const props = defineProps<{
    currentWorkerKey: string;
}>();

const emit = defineEmits<{
    (e: 'onWorkerItemClick', worker: BaseWorkInfo): void;
    (e: 'onWorkerListChange'): void;
}>();

const addWorkerDialogRef = ref<InstanceType<typeof AddWorkerDialog>>();

const workerList = ref<BaseWorkInfo[]>([]);

const getWorkerList = async () => {
    const { data } = await requestGetWorkerList();
    workerList.value = data;

    if (!workerList.value || !workerList.value.length) {
        emit('onWorkerListChange');
        return
    }

    if (!props.currentWorkerKey || !workerList.value.some(item => item.key === props.currentWorkerKey)) {
        emit('onWorkerItemClick', data[0]);
    }
}

const handleTabsEdit = (targetName: TabPaneName | undefined, action: 'remove' | 'add') => {

}

const handleWorkerItemClick = (e: TabsPaneContext) => {
    emit('onWorkerItemClick', workerList.value[Number(e.index) ?? 0]);
}

const handleAddWorker = () => {
    addWorkerDialogRef.value?.open();
}

const handleWorkerListChange = () => {
    getWorkerList();
}

const handleTabRemove = async (key: TabPaneName) => {
    const { data } = await requestGetWorkerList();
    const targetWorker = data.find(item => item.key === key);

    if (!targetWorker) {
        ElMessage.error('Worker不存在')
        return
    }

    const flag = targetWorker.taskList.some(el => el.status === TaskStatus.RUNNING);

    if (flag) {
        ElMessage.error('Worker正在运行中，请先暂停')
        return
    }
    await requestRemoveWorker(targetWorker.key);
    ElMessage.success('Worker删除成功');
}

onMounted(() => {
    getWorkerList();

    WSMessageEvent.instance.on(WSMessage.Worker.ListChange.type, handleWorkerListChange);
});

onUnmounted(() => {
    WSMessageEvent.instance.off(WSMessage.Worker.ListChange.type, handleWorkerListChange);
});
</script>

<style scoped lang="scss">
@use "./index.scss";
</style>