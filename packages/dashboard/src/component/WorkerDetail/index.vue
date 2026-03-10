<template>
    <div v-if="workerDetail" class="worker-detail">
        <div v-if="WXWorkerN.isWXWorkerInfo(workerDetail)" class="wx content-container">
            <!-- 操作栏 -->
            <div class="controller">
                <el-button @click="handleEditWorker">修改</el-button>
                <el-button style="margin: 0;" v-if="workerDetail?.isLogin" type="primary" :loading="workerLogoutLoading ||
                    workerDetail.loadings.includes(WXWorkerN.LoadingType.logout)"
                    @click="handleWorkerLogout">退出登录</el-button>
                <el-button style="margin: 0;" plain type="danger"
                    @click="handleTabRemove(workerDetail)">删除Worker</el-button>

            </div>
            <!-- 未登录 -->
            <div v-if="!workerDetail?.isLogin" class="no-login">
                <div v-if="workerDetail.loginQRCodeFilePath" class="qrcode-container">
                    <div class="text">请使用微信扫码登录微信公众平台</div>
                    <img class="qrcode" :src="getFileUrl(workerDetail.loginQRCodeFilePath)" />
                </div>
                <el-button type="primary" :loading="handleWorkerLoginLoading ||
                    workerDetail.loadings.includes(WXWorkerN.LoadingType.login)" @click="handleWorkerLogin">
                    {{
                        workerDetail.loginQRCodeFilePath ? '重新获取登录二维码' : '获取登录二维码'
                    }}
                </el-button>
            </div>
            <!-- 登录 -->
            <div v-else class="login-content">
                <WXAList class="wxa-list" :workerDetail="workerDetail" @onRefreshWorkerDetail="getWorkerDetail" />
                <TaskStack class="task-stack" :workerDetail="workerDetail" />
            </div>
        </div>
        <AddTaskDialog ref="addTaskDialogRef" />
        <AddWorkerDialog ref="addWorkerDialogRef" @onSuccess="getWorkerDetail" />
    </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, watch, ref, provide } from 'vue';
import { getFileUrl, requestGetWorkerDetail, requestGetWorkerList, requestLoginWorker, requestLogoutWorker, requestRemoveWorker } from '@/api';
import { WXWorkerN, type BaseWorkInfo } from '@mp-assistant/common/dist/work';
import WXAList from './component/WXAList/index.vue';
import TaskStack from './component/TaskStack/index.vue';
import { WSMessageEvent } from '@/event/WSMessageEvent';
import { WSMessage } from '@mp-assistant/common/dist/ws';
import { useApiCall } from '@/hooks/useApiCall';
import AddTaskDialog from './component/AddTaskDialog/index.vue';
import type { AddTaskFormData } from './component/AddTaskDialog/index';
import { getSuccessApiResponse } from '@mp-assistant/common/dist/api/utils';
import { ElMessage, ElMessageBox } from 'element-plus';
import AddWorkerDialog from '@/component/AddWorkerDialog/index.vue';

const props = defineProps<{
    workerKey: string;
}>();

const addTaskDialogRef = ref<InstanceType<typeof AddTaskDialog>>();
const addWorkerDialogRef = ref<InstanceType<typeof AddWorkerDialog>>();

const { data: workerDetail, call: getWorkerDetail } = useApiCall(async () => {
    const { data: workList } = await requestGetWorkerList();
    if (workList.some(item => item.key === props.workerKey)) {
        return await requestGetWorkerDetail(props.workerKey);
    }
    return getSuccessApiResponse(null);
});

const { loading: handleWorkerLoginLoading, call: handleWorkerLogin } = useApiCall(async () => {
    const res = await requestLoginWorker(props.workerKey);
    // 重写获取worker状态
    await getWorkerDetail();
    return res;
});

const { loading: workerLogoutLoading, call: workerLogout } = useApiCall(async () => {
    const res = await requestLogoutWorker(props.workerKey);
    // 重写获取worker状态
    await getWorkerDetail();
    return res;
});

watch(() => props.workerKey, () => {
    getWorkerDetail();
});

const handleWorkerListChange = async (data: WSMessage.Worker.DetailChange.Data) => {
    if (data.key === props.workerKey) {
        await getWorkerDetail();
    }
}

const handleAddTask = (formData?: AddTaskFormData) => {
    addTaskDialogRef.value?.open(props.workerKey, formData);
}

const handleEditWorker = () => {
    if (workerDetail.value) {
        addWorkerDialogRef.value?.open(true, workerDetail.value.key, workerDetail.value.name, workerDetail.value.type);
    }
}

const handleWorkerLogout = () => {
    ElMessageBox.confirm(`确定退出登录吗？`, '提示', {
        type: 'warning',
        confirmButtonText: '确定',
        cancelButtonText: '取消',
    }).then(async () => {
        await workerLogout();
    })
}

const handleTabRemove = async (item: BaseWorkInfo) => {
    const { data } = await requestGetWorkerList();
    const targetWorker = data.find(item_ => item_.key === item.key);

    ElMessageBox.confirm(`确定删除Worker：${targetWorker?.name}吗？`, '提示', {
        type: 'warning',
        confirmButtonText: '确定',
        cancelButtonText: '取消',
    }).then(async () => {
        if (!targetWorker) {
            ElMessage.error('Worker不存在')
            return
        }

        await requestRemoveWorker(targetWorker.key);
        ElMessage.success('Worker删除成功');
    })

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

provide('handleAddTask', handleAddTask);
</script>

<style scoped lang="scss">
@use "./index.scss";
</style>