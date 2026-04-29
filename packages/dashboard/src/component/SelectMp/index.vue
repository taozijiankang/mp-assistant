<template>
    <div class="select-mp-container">
        <div class="selected-preview">
            <div class="selected-header">
                <span class="selected-count">
                    已选择
                    <span class="count-number">{{ totalSelectedCount }}</span>
                    个小程序
                    <template v-if="workerKeyCount > 1">
                        ，跨 <span class="count-number">{{ workerKeyCount }}</span> 个账号
                    </template>
                </span>
                <el-button v-if="totalSelectedCount > 0" link type="danger" @click="handleClearAll">清空</el-button>
            </div>
            <div v-if="totalSelectedCount > 0" class="selected-groups">
                <div v-for="t in normalizedTargets" :key="t.workerKey" class="selected-group">
                    <div class="group-label">{{ getWorkerLabel(t.workerKey) }}</div>
                    <div class="selected-chip-list">
                        <div v-for="appid in t.appIds" :key="`${t.workerKey}-${appid}`" class="selected-chip">
                            <img class="chip-icon" :src="getWxaInfo(t.workerKey, appid).app_headimg" alt="icon" />
                            <span class="chip-name" :title="getWxaInfo(t.workerKey, appid).app_name || appid">
                                {{ getWxaInfo(t.workerKey, appid).app_name || appid }}
                            </span>
                            <el-icon class="chip-close" @click.stop="handleRemove(t.workerKey, appid)">
                                <Close />
                            </el-icon>
                        </div>
                    </div>
                </div>
            </div>
            <div v-else class="selected-empty">暂未选择小程序</div>
        </div>
        <el-button @click="openInnerDialog">选择小程序</el-button>

        <el-dialog v-model="showSelectMpDialog" title="选择小程序" width="1100px" @opened="onInnerDialogOpened">
            <div class="dialog-body">
                <aside v-if="normalizedTargets.length > 0" class="worker-sidebar">
                    <div v-for="t in normalizedTargets" :key="t.workerKey" class="worker-sidebar-item"
                        :class="{ active: t.workerKey === activeWorkerKey }" @click="activeWorkerKey = t.workerKey">
                        <span class="worker-sidebar-name">{{ getWorkerLabel(t.workerKey) }}</span>
                        <span class="worker-sidebar-count">{{ countForWorker(t.workerKey) }}</span>
                    </div>
                </aside>
                <div class="worker-main">
                    <div class="dialog-content-container">
                        <div class="wxa-item-container-scrollbar-header">
                            <el-input v-model="searchValue" placeholder="请输入过滤关键词" clearable />
                            <el-button @click="handleAllSelected">全部选中</el-button>
                            <el-button @click="handleCancelSelected">取消选中</el-button>
                        </div>
                        <div v-if="markedAppidListForActive" class="filter-bar">
                            <el-radio-group v-model="markFilter" size="small">
                                <el-radio-button :value="MarkFilter.All">全部</el-radio-button>
                                <el-radio-button :value="MarkFilter.Marked">已标记 {{ markedCount }}</el-radio-button>
                                <el-radio-button :value="MarkFilter.Unmarked">未标记</el-radio-button>
                            </el-radio-group>
                            <span class="total-count">共 {{ filteredWxaList.length }} 条</span>
                        </div>
                        <div v-if="activeLoadError" class="load-error">{{ activeLoadError }}</div>
                        <el-scrollbar v-else-if="filteredWxaList.length > 0" class="wxa-grid-scrollbar" height="500px">
                            <div class="wxa-grid">
                                <WXAItem class="wxa-card" :class="{ selected: currentAppIds.includes(item.appid) }"
                                    v-for="item in filteredWxaList" :key="item.appid" :wxa-item="item"
                                    @click="handleToggleApp(item.appid)">
                                    <template #prefix>
                                        <div class="select-indicator"
                                            :class="{ checked: currentAppIds.includes(item.appid) }">
                                            <el-icon v-if="currentAppIds.includes(item.appid)">
                                                <Check />
                                            </el-icon>
                                        </div>
                                    </template>
                                    <template v-if="markedAppidListForActive?.includes(item.appid)" #extra>
                                        <el-icon class="star-icon">
                                            <StarFilled />
                                        </el-icon>
                                    </template>
                                </WXAItem>
                            </div>
                        </el-scrollbar>
                        <el-empty v-else-if="!activeLoading" description="暂无数据" />
                        <div v-else class="loading-hint">加载中…</div>
                    </div>
                </div>
            </div>
            <template #footer>
                <div class="dialog-footer">
                    <span class="footer-info">已选 {{ totalSelectedCount }} 个</span>
                    <el-button type="primary" @click="showSelectMpDialog = false">完成</el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import type { WXMPItem } from '@mp-assistant/common/dist/types/wx';
import fuzzysort from 'fuzzysort';
import { ref, computed, watch } from 'vue';
import WXAItem from '@/component/WXAItem/index.vue';
import { StarFilled, Check, Close } from '@element-plus/icons-vue';
import { requestGetWorkerDetail } from '@/api';
import { WXWorkerN } from '@mp-assistant/common/dist/work';

/**
 * v-model 每一项（本组件自用，与添加任务里 targets 项字段保持一致即可）
 */
interface SelectMpRow {
    workerKey: string;
    workerName?: string;
    appIds: string[];
}

const props = defineProps<{
    modelValue: SelectMpRow[];
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: SelectMpRow[]): void;
}>();

/** 合并同一 workerKey 的多行 */
const mergeTargets = (list: SelectMpRow[]): SelectMpRow[] => {
    const map = new Map<string, SelectMpRow>();
    for (const t of list) {
        const key = t.workerKey;
        if (!key) continue;
        if (!map.has(key)) {
            map.set(key, {
                workerKey: key,
                workerName: t.workerName,
                appIds: [...t.appIds],
            });
        } else {
            const ex = map.get(key)!;
            ex.appIds = [...new Set([...ex.appIds, ...t.appIds])];
            if (t.workerName) ex.workerName = t.workerName;
        }
    }
    return Array.from(map.values());
};

const normalizedTargets = computed(() => mergeTargets(props.modelValue));

const totalSelectedCount = computed(() =>
    normalizedTargets.value.reduce((s, t) => s + t.appIds.length, 0)
);

const workerKeyCount = computed(() =>
    normalizedTargets.value.filter(t => t.appIds.length > 0).length
);

const showSelectMpDialog = ref(false);
const searchValue = ref('');
const activeWorkerKey = ref('');

const detailsByKey = ref<Record<string, WXWorkerN.WXWorkInfo | undefined>>({});
const loadErrorByKey = ref<Record<string, string>>({});
const loadingKeys = ref<Set<string>>(new Set());

enum MarkFilter {
    All = 'all',
    Marked = 'marked',
    Unmarked = 'unmarked',
}
const markFilter = ref<MarkFilter>(MarkFilter.All);

const uniqueWorkerKeys = computed(() => [...new Set(normalizedTargets.value.map(t => t.workerKey))]);

const fetchWorkerDetail = async (workerKey: string) => {
    if (!workerKey || detailsByKey.value[workerKey] || loadingKeys.value.has(workerKey)) return;
    const nextLoading = new Set(loadingKeys.value);
    nextLoading.add(workerKey);
    loadingKeys.value = nextLoading;
    loadErrorByKey.value = { ...loadErrorByKey.value, [workerKey]: '' };
    try {
        const { data } = await requestGetWorkerDetail(workerKey);
        if (WXWorkerN.isWXWorkerInfo(data)) {
            detailsByKey.value = { ...detailsByKey.value, [workerKey]: data };
        } else {
            loadErrorByKey.value = { ...loadErrorByKey.value, [workerKey]: '无效的 Worker 信息' };
        }
    } catch {
        loadErrorByKey.value = { ...loadErrorByKey.value, [workerKey]: '加载失败' };
    } finally {
        const next = new Set(loadingKeys.value);
        next.delete(workerKey);
        loadingKeys.value = next;
    }
};

watch(
    uniqueWorkerKeys,
    keys => {
        keys.forEach(k => fetchWorkerDetail(k));
    },
    { immediate: true }
);

const activeDetail = computed(() =>
    activeWorkerKey.value ? detailsByKey.value[activeWorkerKey.value] : undefined
);

const activeLoading = computed(() => loadingKeys.value.has(activeWorkerKey.value));
const activeLoadError = computed(() => loadErrorByKey.value[activeWorkerKey.value]);

const wxaListForActive = computed(() => activeDetail.value?.wxaList ?? []);
const markedAppidListForActive = computed(() => activeDetail.value?.markWXAppIds);

const currentAppIds = computed(() => {
    const t = normalizedTargets.value.find(x => x.workerKey === activeWorkerKey.value);
    return t?.appIds ?? [];
});

const markedCount = computed(() => {
    const marked = markedAppidListForActive.value;
    if (!marked) return 0;
    return wxaListForActive.value.filter(item => marked.includes(item.appid)).length;
});

const filteredWxaList = computed(() => {
    const list = wxaListForActive.value;
    const markFilteredList = list.filter(item => {
        if (markFilter.value === MarkFilter.All || !markedAppidListForActive.value) {
            return true;
        }
        const isMarked = markedAppidListForActive.value.includes(item.appid);
        return markFilter.value === MarkFilter.Marked ? isMarked : !isMarked;
    });

    if (!searchValue.value) {
        return markFilteredList.slice().sort((a, b) =>
            a.app_name.localeCompare(b.app_name, 'zh-CN', { numeric: true }),
        );
    }
    const fuzzysortKeys: { key: (item: WXMPItem) => string; weight: number }[] = [
        { key: item => item.app_name, weight: 3 },
        { key: item => item.appid, weight: 2 },
        { key: item => item.username, weight: 1 },
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

const getWorkerLabel = (workerKey: string) => {
    const d = detailsByKey.value[workerKey];
    if (d?.name) return d.name;
    const t = normalizedTargets.value.find(x => x.workerKey === workerKey);
    return t?.workerName || workerKey;
};

const countForWorker = (workerKey: string) => {
    const t = normalizedTargets.value.find(x => x.workerKey === workerKey);
    return t?.appIds.length ?? 0;
};

const getWxaInfo = (workerKey: string, appid: string): WXMPItem => {
    const list = detailsByKey.value[workerKey]?.wxaList ?? [];
    return (
        list.find(item => item.appid === appid) || {
            appid,
            app_name: '',
            username: '',
            app_headimg: '',
            email: '',
            type: '',
        }
    );
};

const emitMerged = (next: SelectMpRow[]) => {
    emit('update:modelValue', mergeTargets(next));
};

const handleToggleApp = (appid: string) => {
    const key = activeWorkerKey.value;
    if (!key) return;
    const next = normalizedTargets.value.map(t => {
        if (t.workerKey !== key) return { ...t, appIds: [...t.appIds] };
        const set = new Set(t.appIds);
        if (set.has(appid)) set.delete(appid);
        else set.add(appid);
        return { ...t, appIds: [...set] };
    });
    emitMerged(next);
};

const handleRemove = (workerKey: string, appid: string) => {
    const next = normalizedTargets.value.map(t =>
        t.workerKey === workerKey
            ? { ...t, appIds: t.appIds.filter(id => id !== appid) }
            : { ...t, appIds: [...t.appIds] }
    );
    emitMerged(next);
};

const handleClearAll = () => {
    emitMerged(normalizedTargets.value.map(t => ({ ...t, appIds: [] })));
};

const handleAllSelected = () => {
    const key = activeWorkerKey.value;
    if (!key) return;
    const addIds = filteredWxaList.value.map(item => item.appid);
    const next = normalizedTargets.value.map(t => {
        if (t.workerKey !== key) return { ...t, appIds: [...t.appIds] };
        return { ...t, appIds: [...new Set([...t.appIds, ...addIds])] };
    });
    emitMerged(next);
};

const handleCancelSelected = () => {
    const key = activeWorkerKey.value;
    if (!key) return;
    const removeSet = new Set(filteredWxaList.value.map(item => item.appid));
    const next = normalizedTargets.value.map(t => {
        if (t.workerKey !== key) return { ...t, appIds: [...t.appIds] };
        return { ...t, appIds: t.appIds.filter(id => !removeSet.has(id)) };
    });
    emitMerged(next);
};

const openInnerDialog = () => {
    showSelectMpDialog.value = true;
};

const onInnerDialogOpened = () => {
    searchValue.value = '';
    markFilter.value = MarkFilter.All;
    if (!activeWorkerKey.value && normalizedTargets.value.length > 0) {
        activeWorkerKey.value = normalizedTargets.value[0].workerKey;
    }
};

watch(
    normalizedTargets,
    list => {
        if (!list.length) {
            activeWorkerKey.value = '';
            return;
        }
        if (!list.some(t => t.workerKey === activeWorkerKey.value)) {
            activeWorkerKey.value = list[0].workerKey;
        }
    },
    { immediate: true }
);
</script>

<style scoped lang="scss">
@use "./index.scss";
</style>
