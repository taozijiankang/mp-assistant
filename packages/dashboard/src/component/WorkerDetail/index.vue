<template>
    <div v-if="workerDetail" class="worker-detail">
        <div class="top">
            {{ workerDetail?.name || '未命名' }}
        </div>
        <div v-if="WXWorkerN.isWXWorkerInfo(workerDetail)" class="wx content-container">
            <!-- 未登录 -->
            <div v-if="!workerDetail?.isLogin" class="no-login">
                <div v-if="workerDetail.loginQRCodeURL" class="qrcode-container">
                    <div>请使用微信扫码登录</div>
                    <img class="qrcode" :src="workerDetail.loginQRCodeURL" />
                </div>
                <el-button type="primary" :loading="handleWorkerLoginLoading ||
                    workerDetail.loadings.includes(WXWorkerN.LoadingType.login)" @click="handleWorkerLogin">
                    {{
                        workerDetail.loginQRCodeURL ? '重新登录' : '登录'
                    }}
                </el-button>
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
import { onMounted, onUnmounted, watch } from 'vue';
import { requestGetWorkerDetail, requestLoginWorker } from '@/api';
import { WXWorkerN } from 'mp-assistant-common/dist/work';
import WXAList from './component/WXAList/index.vue';
import TaskStack from './component/TaskStack/index.vue';
import { WSMessageEvent } from '@/event/WSMessageEvent';
import { WSMessage } from 'mp-assistant-common/dist/ws';
import { useApiCall } from '@/hooks/useApiCall';

const props = defineProps<{
    workerKey: string;
}>();

const { data: workerDetail, call: getWorkerDetail } = useApiCall(() => requestGetWorkerDetail(props.workerKey));

const { loading: handleWorkerLoginLoading, call: handleWorkerLogin } = useApiCall(async () => {
    const res = await requestLoginWorker(props.workerKey);
    // 重写获取worker状态
    await getWorkerDetail();
    return res;
});

watch(() => props.workerKey, () => {
    getWorkerDetail();
});

const handleWorkerListChange = (data: WSMessage.Worker.DetailChange.Data) => {
    if (data.key === props.workerKey) {
        getWorkerDetail();
    }
}

onMounted(() => {
    WSMessageEvent.instance.on(WSMessage.Worker.DetailChange.type, handleWorkerListChange);

    if (props.workerKey) {
        getWorkerDetail();
    }
});

onUnmounted(() => {
    WSMessageEvent.instance.off(WSMessage.Worker.DetailChange.type, handleWorkerListChange);
});
</script>

<style scoped lang="scss">
@use "./index.scss";
</style>