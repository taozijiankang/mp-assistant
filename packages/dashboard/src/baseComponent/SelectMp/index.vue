<template>
    <div class="select-mp-container">
        <div class="selected-preview">
            <div class="selected-header">
                <span class="selected-count">
                    已选择
                    <span class="count-number">{{ selectedValue.length }}</span>
                    个小程序
                </span>
                <el-button v-if="selectedValue.length > 0" link type="danger" @click="handleClearAll">清空</el-button>
            </div>
            <div v-if="selectedValue.length > 0" class="selected-chip-list">
                <div v-for="appid in selectedValue" :key="appid" class="selected-chip">
                    <img class="chip-icon" :src="getWxaInfo(appid).app_headimg" alt="icon" />
                    <span class="chip-name" :title="getWxaInfo(appid).app_name || appid">
                        {{ getWxaInfo(appid).app_name || appid }}
                    </span>
                    <el-icon class="chip-close" @click.stop="handleRemove(appid)">
                        <Close />
                    </el-icon>
                </div>
            </div>
            <div v-else class="selected-empty">暂未选择小程序</div>
        </div>
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
                        <el-radio-button :value="MarkFilter.Marked">已标记 {{ markedCount }}</el-radio-button>
                        <el-radio-button :value="MarkFilter.Unmarked">未标记</el-radio-button>
                    </el-radio-group>
                    <span class="total-count">共 {{ filteredWxaList.length }} 条</span>
                </div>
                <el-scrollbar v-if="filteredWxaList.length > 0" class="wxa-grid-scrollbar" height="500px">
                    <div class="wxa-grid">
                        <WXAItem class="wxa-card"
                            :class="{ 'selected': selectedValue.includes(item.appid) }"
                            v-for="item in filteredWxaList" :key="item.appid" :wxa-item="item"
                            @click="handleUpdateSelectedValue(item.appid)">
                            <template #prefix>
                                <div class="select-indicator"
                                    :class="{ 'checked': selectedValue.includes(item.appid) }">
                                    <el-icon v-if="selectedValue.includes(item.appid)">
                                        <Check />
                                    </el-icon>
                                </div>
                            </template>
                            <template v-if="markedAppidList?.includes(item.appid)" #extra>
                                <el-icon class="star-icon">
                                    <StarFilled />
                                </el-icon>
                            </template>
                        </WXAItem>
                    </div>
                </el-scrollbar>
                <el-empty v-else description="暂无数据" />
            </div>
            <template #footer>
                <div class="dialog-footer">
                    <span class="footer-info">已选 {{ selectedValue.length }} 个</span>
                    <el-button type="primary" @click="showSelectMpDialog = false">完成</el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import type { WXMPItem } from '@mp-assistant/common/dist/types/wx';
import fuzzysort from 'fuzzysort';
import { ref, computed } from 'vue';
import WXAItem from '../WXAItem/index.vue';
import { StarFilled, Check, Close } from '@element-plus/icons-vue';

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

const markedCount = computed(() => {
    if (!props.markedAppidList) return 0;
    const marked = props.markedAppidList;
    return props.wxaList.filter(item => marked.includes(item.appid)).length;
});

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
        emit('update:selectedValue', [...props.selectedValue, appid]);
    } else {
        emit('update:selectedValue', props.selectedValue.filter(item => item !== appid));
    }
};

const handleRemove = (appid: string) => {
    emit('update:selectedValue', props.selectedValue.filter(item => item !== appid));
};

const handleClearAll = () => {
    emit('update:selectedValue', []);
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
