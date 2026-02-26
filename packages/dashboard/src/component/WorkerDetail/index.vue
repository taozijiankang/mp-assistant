<template>
    <div v-if="workerDetail" class="worker-detail">
        <div class="top">
            {{ workerDetail?.name || '未命名' }}
        </div>
        <div v-if="WXWorkerN.isWXWorkerInfo(workerDetail)" class="wx content-container">
            <!-- 未登录 -->
            <div v-if="!workerDetail?.isLogin" class="no-login">
                <el-button v-if="!workerDetail.loginQRCodeURL" type="primary" @click="handleLogin">登录</el-button>
                <div v-else class="qrcode-container">
                    <div>请使用微信扫码登录</div>
                    <img class="qrcode" :src="workerDetail.loginQRCodeURL" />
                </div>
            </div>
            <!-- 登录 -->
            <div v-else class="login-content">
                <WXAList class="wxa-list" :workerDetail="workerDetail" @onRefreshWorkerDetail="getWorkerDetail" />
                <TaskStack class="task-stack" :workerDetail="workerDetail" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { requestGetWorkerDetail, requestLoginWorker } from '@/api';
import { WXWorkerN, type BaseWorkInfo } from 'mp-assistant-common/dist/work';
import WXAList from './component/WXAList/index.vue';
import TaskStack from './component/TaskStack/index.vue';
import { WSMessageEvent } from '@/event/WSMessageEvent';
import { WSMessage } from 'mp-assistant-common/dist/ws';

const props = defineProps<{
    workerKey: string;
}>();

const workerDetail = ref<BaseWorkInfo>();


watch(() => props.workerKey, () => {
    getWorkerDetail();
});

const getWorkerDetail = async () => {
    const { data } = await requestGetWorkerDetail(props.workerKey);
    workerDetail.value = data;
};

const handleLogin = async () => {
    requestLoginWorker(props.workerKey);
}

const handleWorkerListChange = (data: WSMessage.Worker.DetailChange.Data) => {
    if (data.key === props.workerKey) {
        getWorkerDetail();
    }
}

onMounted(() => {
    WSMessageEvent.instance.on(WSMessage.Worker.DetailChange.type, handleWorkerListChange);
});

onUnmounted(() => {
    WSMessageEvent.instance.off(WSMessage.Worker.DetailChange.type, handleWorkerListChange);
});
</script>

<style scoped lang="scss">
@use "./index.scss";
</style>