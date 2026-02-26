<template>
    <div class="wxa-list">
        <div class="controller">
            <el-input v-model="searchValue" placeholder="请输入小程序名称或AppID进行搜索" clearable />
            <el-button type="primary" @click="handleRefreshWxaList">刷新小程序列表</el-button>
        </div>
        <div class="wxa-item-container">
            <div class="wxa-item" v-for="wxa in filteredWxaList" :key="wxa.appid">
                <img class="wxa-icon" :src="wxa.app_headimg" />
                <div class="wxa-info">
                    <div class="wxa-name">{{ wxa.app_name }}</div>
                    <div class="wxa-appid">{{ wxa.appid }}</div>
                    <div class="wxa-appid">{{ wxa.username }}</div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { requestWorkerUpdateWxaList } from '@/api';
import type { WXWorkerN } from 'mp-assistant-common/dist/work';
import { ref, computed } from 'vue';

const props = defineProps<{
    workerDetail: WXWorkerN.WXWorkInfo
}>();

const emit = defineEmits<{
    (e: 'onRefreshWorkerDetail'): void;
}>();

const searchValue = ref('');

const filteredWxaList = computed(() => {
    if (!searchValue.value) {
        return props.workerDetail.wxaList;
    }
    return props.workerDetail.wxaList.filter(wxa => wxa.app_name.includes(searchValue.value) || wxa.appid.includes(searchValue.value));
});

const handleRefreshWxaList = async () => {
    await requestWorkerUpdateWxaList(props.workerDetail.key);
    emit('onRefreshWorkerDetail');
};
</script>

<style scoped lang="scss">
@use "./index.scss";
</style>