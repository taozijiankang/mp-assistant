<template>
    <div class="wxa-list">
        <div class="controller">
            <el-input v-model="searchValue" placeholder="请输入小程序名称或AppID进行搜索" clearable />
            <el-button type="primary"
                :loading="refreshWxaListLoading || workerDetail.loadings.includes(WXWorkerN.LoadingType.updateWxaListWxaList)"
                @click="handleRefreshWxaList">刷新小程序列表</el-button>
        </div>
        <div class="wxa-item-container">
            <div class="wxa-item" v-for="wxa in filteredWxaList" :key="wxa.wxaItem.appid">
                <img class="wxa-icon" :src="wxa.wxaItem.app_headimg" />
                <div class="wxa-info">
                    <div class="wxa-name">{{ wxa.wxaItem.app_name }}</div>
                    <div class="wxa-appid">{{ wxa.wxaItem.appid }}</div>
                    <div class="wxa-appid">{{ wxa.wxaItem.username }}</div>
                </div>
                {{ wxa.versionInfo }}
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { requestWorkerUpdateWxaList } from '@/api';
import { useApiCall } from '@/hooks/useApiCall';
import type { WXMPItem } from 'mp-assistant-common/dist/types/wx';
import { WXWorkerN } from 'mp-assistant-common/dist/work';
import { TaskStatus, TaskType, WXTaskN } from 'mp-assistant-common/dist/work/task';
import { ref, computed } from 'vue';

const props = defineProps<{
    workerDetail: WXWorkerN.WXWorkInfo
}>();

const emit = defineEmits<{
    (e: 'onRefreshWorkerDetail'): void;
}>();

const searchValue = ref('');

const filteredWxaList = computed(() => {
    const wxaList: WXMPItem[] = [];
    if (!searchValue.value) {
        wxaList.push(...props.workerDetail.wxaList);
    } else {
        wxaList.push(...props.workerDetail.wxaList.filter(wxa => wxa.app_name.includes(searchValue.value) || wxa.appid.includes(searchValue.value)));
    }
    return wxaList.map(item => {
        return {
            wxaItem: item,
            versionInfo: props.workerDetail.taskList.filter(item => {
                return item.status === TaskStatus.COMPLETED;
            }).filter(item => item.type === TaskType.WX_INSPECT_VERSION).find(taskItem => {
                const options: WXTaskN.TaskOptions = taskItem.options;
                return options.app_name === item.app_name && options.username === item.username;
            })?.result?.data as WXTaskN.GetVersionListResult,
        };
    });
});

const { loading: refreshWxaListLoading, call: handleRefreshWxaList } = useApiCall(async () => {
    const res = await requestWorkerUpdateWxaList(props.workerDetail.key);
    emit('onRefreshWorkerDetail');
    return res;
});
</script>

<style scoped lang="scss">
@use "./index.scss";
</style>