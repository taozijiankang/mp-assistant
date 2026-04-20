<template>
    <div class="select-mp-container">
        <div v-if="selectedValue.length > 0" class="selected-value-container">
            <WXAItem class="selected-value-item" v-for="item in selectedValue" :key="item"
                :wxa-item="getWxaInfo(item)" />
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
                <div v-if="markedAppidList" class="filter-bar">
                    <el-radio-group v-model="markFilter" size="small">
                        <el-radio-button :value="MarkFilter.All">全部</el-radio-button>
                        <el-radio-button :value="MarkFilter.Marked">已标记</el-radio-button>
                        <el-radio-button :value="MarkFilter.Unmarked">未标记</el-radio-button>
                    </el-radio-group>
                    <span class="total-count">共 {{ filteredWxaList.length }} 条</span>
                </div>
                <div v-if="filteredWxaList.length > 0" class="wxa-item-container-scrollbar">
                    <WXAItem class="wxa-item-container" :class="{
                        'selected': selectedValue.includes(item.appid)
                    }" v-for="item in filteredWxaList" :key="item.appid" :wxa-item="item"
                        @click="handleUpdateSelectedValue(item.appid)">
                        <template #prefix>
                            <img v-if="selectedValue.includes(item.appid)" src="@/assets/check.png" alt="选中"
                                class="wxa-icon-selected">
                            <img v-else src="@/assets/no-check.png" alt="选中" class="wxa-icon-selected">
                        </template>
                        <template v-if="markedAppidList?.includes(item.appid)" #extra>
                            <img src="@/assets/mark.png" alt="star" class="star-icon" />
                        </template>
                    </WXAItem>
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
import WXAItem from '../WXAItem/index.vue';

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

enum MarkFilter {
    All = 'all',
    Marked = 'marked',
    Unmarked = 'unmarked',
}
const markFilter = ref<MarkFilter>(MarkFilter.All);

const filteredWxaList = computed(() => {
    const markFilteredList = props.wxaList.filter(item => {
        if (markFilter.value === MarkFilter.All || !props.markedAppidList) {
            return true;
        }
        const isMarked = props.markedAppidList.includes(item.appid);
        return markFilter.value === MarkFilter.Marked ? isMarked : !isMarked;
    });

    if (!searchValue.value) {
        return markFilteredList;
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
    return fuzzysort.go(searchValue.value, markFilteredList, {
        keys: fuzzysortKeys.map(item => item.key),
        scoreFn: item => {
            return fuzzysortKeys.reduce((a, b, i) => {
                return a + item[i].score * b.weight;
            }, 0);
        },
    }).map(item => item.obj);
});

const getWxaInfo = (appid: string): WXMPItem => {
    return props.wxaList.find(item => item.appid === appid) || {
        appid,
        app_name: '',
        username: '',
        app_headimg: '',
        email: '',
        type: '',
    };
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