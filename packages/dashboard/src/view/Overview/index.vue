<template>
    <div class="overview-page">
        <aside class="side-panel">
            <div class="side-header">
                <span class="side-title">查找</span>
                <el-button v-if="keyword" size="small" text @click="keyword = ''">清空</el-button>
            </div>

            <div class="side-section">
                <div class="section-label">匹配字段</div>
                <el-radio-group v-model="filterField" size="small" class="filter-field">
                    <el-radio-button v-for="opt in filterFieldOptions" :key="opt.value" :value="opt.value">
                        {{ opt.label }}
                    </el-radio-button>
                </el-radio-group>
            </div>

            <div class="side-section side-section--search">
                <div class="section-label">查找内容</div>
                <el-input v-model="keyword" type="textarea" :autosize="{ minRows: 6, maxRows: 15 }" class="search-input"
                    :placeholder="`一行一个 ${currentFieldLabel}，支持批量粘贴`" />
                <div class="filter-mode">
                    <span class="filter-mode-label">模糊匹配</span>
                    <el-switch v-model="fuzzyMatch" size="small" />
                </div>
            </div>

            <div class="side-section side-section--summary">
                <div class="summary">
                    <template v-if="requestedValues.length">
                        <div class="summary-row">查找 <b>{{ requestedValues.length }}</b> 个 {{ currentFieldLabel }}</div>
                        <div class="summary-row num-ok">匹配 {{ matchedMpCount }} 个小程序</div>
                        <div v-if="missingValues.length" class="summary-row num-miss">
                            未找到 {{ missingValues.length }} 个
                        </div>
                    </template>
                    <template v-else>
                        <div class="summary-row">共 <b>{{ allMps.length }}</b> 个小程序</div>
                        <div class="summary-row"><b>{{ activeWorkers.length }}</b> 个账号</div>
                    </template>
                </div>
            </div>

            <div v-if="missingValues.length" class="missing-panel">
                <div class="missing-header">
                    <span class="missing-label">
                        未找到的 {{ currentFieldLabel }}
                        <span class="missing-count">{{ missingValues.length }}</span>
                    </span>
                    <el-button size="small" text class="copy-all-btn" @click="handleCopy(missingValues.join('\n'))">
                        <el-icon>
                            <CopyDocument />
                        </el-icon>
                        <span>复制全部</span>
                    </el-button>
                </div>
                <div class="missing-list">
                    <div v-for="v in missingValues" :key="v" class="missing-chip" @click="handleCopy(v)">
                        <span class="missing-chip-text">{{ v }}</span>
                        <el-icon class="missing-chip-copy">
                            <CopyDocument />
                        </el-icon>
                    </div>
                </div>
            </div>
        </aside>
        <div class="main-panel">
            <div class="action-bar">
                <div class="action-bar-left">
                    <span class="action-summary">
                        已选
                        <b>{{ selectedCount }}</b>
                        个小程序
                        <template v-if="selectedWorkerCount > 0">
                            · 跨 <b>{{ selectedWorkerCount }}</b> 个账号
                        </template>
                    </span>
                    <el-button v-if="selectedCount > 0" size="small" text @click="handleClearSelection">
                        清空
                    </el-button>
                </div>
                <div class="action-bar-right">
                    <el-button type="primary" :disabled="selectedCount === 0" @click="handleBatchAddTask">
                        添加任务
                    </el-button>
                </div>
            </div>
            <div v-if="activeWorkers.length > 0 && visibleRows.length > 0" class="table-panel">
                <el-table class="overview-table" :data="visibleRows" :row-class-name="overviewRowClassName"
                    row-key="appid" border height="100%">
                    <el-table-column label="#" width="56" fixed="left" align="center">
                        <template #default="{ $index }">{{ $index + 1 }}</template>
                    </el-table-column>
                    <el-table-column v-for="worker in activeWorkers" :key="worker.key" :min-width="WORKER_COL_WIDTH"
                        align="left">
                        <template #header>
                            <div class="worker-col-header">
                                <span class="worker-name" :title="worker.name">{{ worker.name }}</span>
                                <span class="worker-count">{{ worker.wxaList.length }}</span>
                            </div>
                        </template>
                        <template #default="{ row }">
                            <div class="overview-cell" :class="{ 'is-selectable': !!getWxa(worker, row.appid) }"
                                @click="getWxa(worker, row.appid) && handleToggleSelect(worker.key, row.appid)">
                                <WXAItem v-if="getWxa(worker, row.appid)" :wxa-item="getWxa(worker, row.appid)!">
                                    <template #prefix>
                                        <el-checkbox class="cell-checkbox"
                                            :model-value="isSelected(worker.key, row.appid)" @click.stop
                                            @change="handleToggleSelect(worker.key, row.appid)" />
                                    </template>
                                    <template #extra>
                                        <el-icon v-if="worker.markWXAppIds.includes(row.appid)" class="star-icon marked"
                                            @click.stop="handleToggleMark(worker, row.appid, false)">
                                            <StarFilled />
                                        </el-icon>
                                        <el-icon v-else class="star-icon"
                                            @click.stop="handleToggleMark(worker, row.appid, true)">
                                            <Star />
                                        </el-icon>
                                    </template>
                                </WXAItem>
                            </div>
                        </template>
                    </el-table-column>
                </el-table>
            </div>
            <el-empty v-else class="empty-state" :description="activeWorkers.length === 0 ? '暂无已登录的账号' : '没有匹配的小程序'" />
        </div>
        <AddTaskDialog ref="addTaskDialogRef" />
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, reactive } from 'vue';
import { Star, StarFilled, CopyDocument } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import WXAItem from '@/component/WXAItem/index.vue';
import { requestGetWorkerList, requestGetWorkerDetail, requestMarkWXAppId } from '@/api';
import { WXWorkerN } from '@mp-assistant/common/dist/work';
import type { WXMPItem } from '@mp-assistant/common/dist/types/wx';
import { WSMessage } from '@mp-assistant/common/dist/ws/message.js';
import { WSMessageEvent } from '@/event/WSMessageEvent';
import AddTaskDialog from '@/component/AddTaskDialog/index.vue';

type FilterField = 'appid' | 'app_name' | 'username';

/** 总览勾选聚合出的「账号 + appId 列表」（字段与添加任务 targets 项一致） */
interface OverviewSelectionRow {
    workerKey: string;
    workerName?: string;
    appIds: string[];
}

const filterFieldOptions: { value: FilterField; label: string }[] = [
    { value: 'appid', label: 'appid' },
    { value: 'app_name', label: '名称' },
    { value: 'username', label: '原始 ID' },
];

const filterField = ref<FilterField>('appid');
const fuzzyMatch = ref(false);
const keyword = ref('');
const workers = ref<WXWorkerN.WXWorkInfo[]>([]);

const currentFieldLabel = computed(
    () => filterFieldOptions.find(o => o.value === filterField.value)?.label ?? ''
);

const loadData = async () => {
    const { data: list } = await requestGetWorkerList();
    const wxList = list.filter(WXWorkerN.isWXWorkerInfo);
    const details = await Promise.all(
        wxList.map(async w => {
            const { data } = await requestGetWorkerDetail(w.key);
            return data;
        })
    );
    workers.value = details.filter((d): d is WXWorkerN.WXWorkInfo =>
        !!d && WXWorkerN.isWXWorkerInfo(d)
    );
};

const activeWorkers = computed(() =>
    workers.value
        .filter(w => w.isLogin)
        .sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0))
);

const allMps = computed<WXMPItem[]>(() => {
    const map = new Map<string, WXMPItem>();
    activeWorkers.value.forEach(w => {
        w.wxaList.forEach(mp => {
            if (!map.has(mp.appid)) map.set(mp.appid, mp);
        });
    });
    return Array.from(map.values());
});

const requestedValues = computed<string[]>(() => {
    const result: string[] = [];
    keyword.value.split(/\r?\n/).forEach(line => {
        const v = line.trim();
        if (v && !result.includes(v)) result.push(v);
    });
    return result;
});

const isMatch = (mpValue: string, query: string): boolean => {
    if (fuzzyMatch.value) {
        return mpValue.toLowerCase().includes(query.toLowerCase());
    }
    return mpValue === query;
};

const matchedMpCount = computed(() => {
    const field = filterField.value;
    const queries = requestedValues.value;
    if (queries.length === 0) return 0;
    return allMps.value.filter(mp =>
        queries.some(v => isMatch(mp[field], v))
    ).length;
});

const missingValues = computed(() => {
    const field = filterField.value;
    return requestedValues.value.filter(v =>
        !allMps.value.some(mp => isMatch(mp[field], v))
    );
});

type OverviewRow = { appid: string; highlighted: boolean };

const visibleRows = computed<OverviewRow[]>(() => {
    const field = filterField.value;
    const queries = requestedValues.value;
    const rows: OverviewRow[] = allMps.value.map(mp => ({
        appid: mp.appid,
        highlighted: queries.some(v => isMatch(mp[field], v)),
    }));
    if (queries.length === 0) return rows;
    return rows.slice().sort((a, b) => Number(b.highlighted) - Number(a.highlighted));
});

const overviewRowClassName = ({ row }: { row: OverviewRow }) =>
    row.highlighted ? 'overview-row--search-hit' : '';

const getWxa = (worker: WXWorkerN.WXWorkInfo, appid: string): WXMPItem | undefined => {
    return worker.wxaList.find(w => w.appid === appid);
};

/** 每个 Worker 列固定宽度（px），与表头、横向滚动布局一致 */
const WORKER_COL_WIDTH = 280;

const handleToggleMark = async (worker: WXWorkerN.WXWorkInfo, appid: string, mark: boolean) => {
    await requestMarkWXAppId(worker.key, { appId: appid, mark });
};

const handleCopy = async (text: string) => {
    if (!text) return;
    try {
        await navigator.clipboard.writeText(text);
        ElMessage.success('已复制');
    } catch {
        ElMessage.error('复制失败');
    }
};

/** 选中的格子集合，key 格式：`${workerKey}::${appid}` */
const selectedMap = reactive<Record<string, boolean>>({});

const makeSelectionKey = (workerKey: string, appid: string) => `${workerKey}::${appid}`;

const isSelected = (workerKey: string, appid: string) =>
    !!selectedMap[makeSelectionKey(workerKey, appid)];

const handleToggleSelect = (workerKey: string, appid: string) => {
    const key = makeSelectionKey(workerKey, appid);
    if (selectedMap[key]) {
        delete selectedMap[key];
    } else {
        selectedMap[key] = true;
    }
};

const handleClearSelection = () => {
    Object.keys(selectedMap).forEach(k => {
        delete selectedMap[k];
    });
};

const selectedTargets = computed<OverviewSelectionRow[]>(() => {
    const map = new Map<string, OverviewSelectionRow>();
    Object.keys(selectedMap).forEach(k => {
        const [workerKey, appid] = k.split('::');
        if (!workerKey || !appid) return;
        const worker = activeWorkers.value.find(w => w.key === workerKey);
        // 账号已被移除/退出登录时跳过
        if (!worker) return;
        // 该账号实际上已经不包含这个小程序时跳过（列表变化后容错）
        if (!worker.wxaList.some(m => m.appid === appid)) return;

        if (!map.has(workerKey)) {
            map.set(workerKey, {
                workerKey,
                workerName: worker.name,
                appIds: [],
            });
        }
        map.get(workerKey)!.appIds.push(appid);
    });
    return Array.from(map.values());
});

const selectedCount = computed(() =>
    selectedTargets.value.reduce((sum, t) => sum + t.appIds.length, 0)
);

const selectedWorkerCount = computed(() => selectedTargets.value.length);

const addTaskDialogRef = ref<InstanceType<typeof AddTaskDialog>>();

const handleBatchAddTask = () => {
    if (selectedCount.value === 0) return;
    addTaskDialogRef.value?.open({ targets: selectedTargets.value });
};

const handleDataChange = () => loadData();

onMounted(() => {
    loadData();
    WSMessageEvent.instance.on(WSMessage.Worker.ListChange.type, handleDataChange);
    WSMessageEvent.instance.on(WSMessage.Worker.DetailChange.type, handleDataChange);
});

onUnmounted(() => {
    WSMessageEvent.instance.off(WSMessage.Worker.ListChange.type, handleDataChange);
    WSMessageEvent.instance.off(WSMessage.Worker.DetailChange.type, handleDataChange);
});
</script>

<style scoped lang="scss">
@use "./index.scss";
</style>
