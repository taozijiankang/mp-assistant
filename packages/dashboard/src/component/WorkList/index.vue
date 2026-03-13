<template>
    <div class="worker-list">
        <el-scrollbar class="worker-list-content-scrollbar">
            <div class="worker-list-content">
                <div class="worker-item" v-for="worker in workerList" :key="worker.key"
                    :class="{ 'selected': worker.key === currentWorkerKey }" @click="handleWorkerItemClick(worker)">
                    <div class="info">
                        <template v-if="worker.type === WorkerType.WX">
                            <img v-if="worker.key === currentWorkerKey" src="@/assets/wx.png" alt="worker"
                                class="icon" />
                            <img v-else src="@/assets/wx_.png" alt="worker" class="icon" />
                        </template>
                        <span class="name">{{ worker.name }}</span>
                    </div>
                    <template v-if="WXWorkerN.isWXWorkerInfo(worker)">
                        <template v-if="worker.isLogin">
                            <div class="wa-info">
                                <span class="span">共{{ worker.wxaList.length }}个小程序</span>
                            </div>
                        </template>
                        <template v-else>
                            <div v-if="worker.loginQRCodeFilePath" class="rq">
                                <span class="text">微信扫码登录微信公众平台</span>
                                <img :src="getFileUrl(worker.loginQRCodeFilePath)" alt="rq" class="icon" />
                            </div>
                        </template>
                    </template>
                </div>
            </div>
        </el-scrollbar>
        <div class="controller">
            <div class="add-worker-button" @click="handleAddWorker">添加Worker</div>
        </div>
        <AddWorkerDialog ref="addWorkerDialogRef" />
    </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { getFileUrl, requestGetWorkerList } from '@/api';
import AddWorkerDialog from '@/component/AddWorkerDialog/index.vue';
import { WSMessage } from "@mp-assistant/common/dist/ws/message.js"
import { WSMessageEvent } from '@/event/WSMessageEvent';
import { WXWorkerN, type BaseWorkInfo } from '@mp-assistant/common/dist/work';
import { WorkerType } from '@mp-assistant/common/dist/work';

const props = defineProps<{
    currentWorkerKey: string;
}>();

const emit = defineEmits<{
    (e: 'currentWorkerKeyChange', key: string): void;
}>();

const addWorkerDialogRef = ref<InstanceType<typeof AddWorkerDialog>>();

const workerList = ref<BaseWorkInfo[]>([]);

const getWorkerList = async () => {
    const { data } = await requestGetWorkerList();

    workerList.value = data;

    if (!workerList.value || !workerList.value.length) {
        emit('currentWorkerKeyChange', '');
        return
    }

    if (!props.currentWorkerKey || !workerList.value.some(item => item.key === props.currentWorkerKey)) {
        emit('currentWorkerKeyChange', data[0]?.key);
    }
}

const handleWorkerItemClick = (item: BaseWorkInfo) => {
    emit('currentWorkerKeyChange', item.key);
}

const handleAddWorker = () => {
    addWorkerDialogRef.value?.open();
}

const handleWorkerListChange = () => {
    getWorkerList();
}

onMounted(() => {
    getWorkerList();

    WSMessageEvent.instance.on(WSMessage.Worker.ListChange.type, handleWorkerListChange);
    WSMessageEvent.instance.on(WSMessage.Worker.DetailChange.type, handleWorkerListChange);
});

onUnmounted(() => {
    WSMessageEvent.instance.off(WSMessage.Worker.ListChange.type, handleWorkerListChange);
    WSMessageEvent.instance.off(WSMessage.Worker.DetailChange.type, handleWorkerListChange);
});
</script>

<style scoped lang="scss">
@use "./index.scss";
</style>