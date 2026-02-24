<template>
    <div v-if="workerDetail" class="worker-detail">
        <div class="top">
            {{ workerDetail?.name }}
        </div>
        <div v-if="isWXWorkerInfo(workerDetail)" class="wx content-container">
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
import type { BaseWorkInfo } from 'mp-assistant-common/dist/work/type';
import { ref, watch } from 'vue';
import { requestGetWorkerDetail, requestLoginWorker } from '@/api';
import { isWXWorkerInfo } from 'mp-assistant-common/dist/work';
import WXAList from './component/WXAList/index.vue';
import TaskStack from './component/TaskStack/index.vue';

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


</script>

<style scoped lang="scss">
@use "./index.scss";
</style>