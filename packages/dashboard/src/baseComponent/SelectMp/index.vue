<template>
    <div class="select-mp-container">
        <div v-if="selectedValue.length > 0" class="selected-value-container">
            <div class="selected-value-item" v-for="item in selectedValue" :key="item">
                <img :src="getWxaInfo(item)?.app_headimg" alt="小程序头像" class="wxa-icon">
                <div class="wxa-info">
                    <span class="selected-value-item-name">{{ getWxaInfo(item)?.app_name }}</span>
                    <span class="selected-value-item-appid">appid: {{ item }}</span>
                    <span class="selected-value-item-username">username: {{ getWxaInfo(item)?.username }}</span>
                </div>
            </div>
        </div>
        <Empty v-else description="请选择小程序" />
        <el-button @click="showSelectMpDialog = true">选择小程序</el-button>
        <!-- 选择小程序弹窗 -->
        <el-dialog v-model="showSelectMpDialog" title="选择小程序" width="1000px">
            <div class="dialog-content-container">
                <div class="wxa-item-container-scrollbar-header">
                    <el-input v-model="searchValue" placeholder="请输入过滤关键词" clearable />
                    <el-button @click="handleAllSelected">全部选中</el-button>
                    <el-button @click="handleCancelSelected">取消选中</el-button>
                </div>
                <div v-if="filteredWxaList.length > 0" class="wxa-item-container-scrollbar">
                    <div class="wxa-item-container" :class="{
                        'selected': selectedValue.includes(item.appid)
                    }" v-for="item in filteredWxaList" :key="item.appid"
                        @click="handleUpdateSelectedValue(item.appid)">
                        <img v-if="selectedValue.includes(item.appid)" src="@/assets/check.png" alt="选中"
                            class="wxa-icon-selected">
                        <img v-else src="@/assets/no-check.png" alt="选中" class="wxa-icon-selected">
                        <img :src="item.app_headimg" alt="小程序头像" class="wxa-icon">
                        <div class="wxa-info">
                            <span class="wxa-name">{{ item.app_name }}</span>
                            <span class="wxa-appid">appid: {{ item.appid }}</span>
                            <span class="wxa-username">username: {{ item.username }}</span>
                        </div>
                        <div v-if="markedAppidList?.includes(item.appid)" class="marked-indicator">
                            <img src="@/assets/mark.png" alt="star" class="star-icon" />
                        </div>
                    </div>
                </div>
                <el-empty v-else description="暂无数据" />
            </div>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import type { WXMPItem } from '@mp-assistant/common/dist/types/wx';
import fuzzysort from 'fuzzysort';
import { ref, computed } from 'vue';
import Empty from '../Empty/index.vue';

const props = defineProps<{
    wxaList: WXMPItem[];
    markedAppidList?: string[];
    selectedValue: string[];
}>();

const emit = defineEmits<{
    (e: 'update:selectedValue', value: string[]): void;
}>();

const showSelectMpDialog = ref(false);

const searchValue = ref('');

const filteredWxaList = computed(() => {
    if (!searchValue.value) {
        return props.wxaList;
    }
    const fuzzysortKeys: {
        key: (item: WXMPItem) => string;
        weight: number;
    }[] = [
            {
                // 小程序名称
                key: item => item.app_name,
                weight: 3,
            },
            {
                // appid
                key: item => item.appid,
                weight: 2,
            },
            {
                // username
                key: item => item.username,
                weight: 1,
            }
        ];
    return fuzzysort.go(searchValue.value, props.wxaList, {
        keys: fuzzysortKeys.map(item => item.key),
        scoreFn: item => {
            return fuzzysortKeys.reduce((a, b, i) => {
                return a + item[i].score * b.weight;
            }, 0);
        },
    }).map(item => item.obj);
});

const getWxaInfo = (appid: string) => {
    return props.wxaList.find(item => item.appid === appid);
};

const handleUpdateSelectedValue = (appid: string) => {
    if (!props.selectedValue.includes(appid)) {
        props.selectedValue.push(appid);
    } else {
        emit('update:selectedValue', props.selectedValue.filter(item => item !== appid));
    }
};

const handleAllSelected = () => {
    emit('update:selectedValue', [
        ...props.selectedValue,
        ...filteredWxaList.value.map(item => item.appid).filter(item => !props.selectedValue.includes(item))
    ]);
};

const handleCancelSelected = () => {
    emit('update:selectedValue', props.selectedValue.filter(item => !filteredWxaList.value.some(item1 => item1.appid === item)));
};
</script>

<style scoped lang="scss">
@use "./index.scss";
</style>