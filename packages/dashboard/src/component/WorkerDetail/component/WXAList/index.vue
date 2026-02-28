<template>
    <div class="wxa-list">
        <div class="controller">
            <el-input v-model="searchValue" placeholder="请输入小程序名称或AppID进行搜索" clearable />
            <el-button type="primary"
                :loading="refreshWxaListLoading || workerDetail.loadings.includes(WXWorkerN.LoadingType.updateWxaListWxaList)"
                @click="handleRefreshWxaList">刷新小程序列表</el-button>
        </div>
        <el-scrollbar v-if="filteredWxaList.length > 0" class="wxa-item-container-scrollbar">
            <div class="wxa-item-container">
                <div class="wxa-item" v-for="wxa in filteredWxaList" :key="wxa.wxaItem.appid">
                    <div class="wxa-info-container">
                        <img class="wxa-icon" :src="wxa.wxaItem.app_headimg" />
                        <div class="wxa-info">
                            <div class="wxa-name">
                                <span>
                                    {{ wxa.wxaItem.app_name }}
                                </span>
                                <el-button type="primary" size="small" link
                                    :loading="restartTaskLoadings.includes(wxa.wxaItem.appid) || wxa.inspectTaskVersionInfo?.status === TaskStatus.RUNNING"
                                    @click="handleRestartTask(wxa.wxaItem)">检测版本信息</el-button>
                            </div>
                            <div class="wxa-appid">appid: {{ wxa.wxaItem.appid }}</div>
                            <div class="wxa-username">username: {{ wxa.wxaItem.username }}</div>
                        </div>
                    </div>
                    <VersionList v-if="wxa.inspectTaskVersionInfo" :task-info="wxa.inspectTaskVersionInfo" />
                </div>
            </div>
        </el-scrollbar>
        <div v-else class="no-data">
            <el-empty description="暂无数据" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { requestAddTask, requestWorkerUpdateWxaList } from '@/api';
import { useApiCall } from '@/hooks/useApiCall';
import type { WXMPItem } from 'mp-assistant-common/dist/types/wx';
import { WXWorkerN } from 'mp-assistant-common/dist/work';
import { TaskStatus, TaskType, WXTaskN } from 'mp-assistant-common/dist/work/task';
import { ref, computed } from 'vue';
import VersionList from "./component/VersionList/index.vue"

const props = defineProps<{
    workerDetail: WXWorkerN.WXWorkInfo
}>();

const emit = defineEmits<{
    (e: 'onRefreshWorkerDetail'): void;
}>();

const searchValue = ref('');

const restartTaskLoadings = ref<string[]>([]);

const filteredWxaList = computed(() => {
    const wxaList: WXMPItem[] = [];
    if (!searchValue.value) {
        wxaList.push(...props.workerDetail.wxaList);
    } else {
        wxaList.push(...props.workerDetail.wxaList.filter(wxa => wxa.app_name.includes(searchValue.value) || wxa.appid.includes(searchValue.value)));
    }
    return wxaList.map(item => {
        const inspectTaskVersionInfo = [...props.workerDetail.taskList].reverse().filter(item => item.type === TaskType.WX_INSPECT_VERSION).find(taskItem => {
            const options: WXTaskN.TaskOptions = taskItem.options;
            return options.app_name === item.app_name && options.username === item.username;
        }) as WXTaskN.InspectVersionInfo | undefined;
        return {
            wxaItem: item,
            inspectTaskVersionInfo,
        };
    });
});

const { loading: refreshWxaListLoading, call: handleRefreshWxaList } = useApiCall(async () => {
    const res = await requestWorkerUpdateWxaList(props.workerDetail.key);
    emit('onRefreshWorkerDetail');
    return res;
});

const handleRestartTask = async (wxa: WXMPItem) => {
    if (restartTaskLoadings.value.includes(wxa.appid)) {
        return;
    }
    restartTaskLoadings.value.push(wxa.appid);
    const options: WXTaskN.TaskOptions = {
        app_name: wxa.app_name,
        username: wxa.username,
    };
    try {
        await requestAddTask(props.workerDetail.key, {
            type: TaskType.WX_INSPECT_VERSION,
            options,
        })
    } finally {
        restartTaskLoadings.value = restartTaskLoadings.value.filter(key => key !== wxa.appid);
    }
};
</script>

<style scoped lang="scss">
@use "./index.scss";
</style>