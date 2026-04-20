<template>
    <div class="overview-page">
        <aside class="side-panel">
            <div class="side-header">
                <span class="side-title">筛选</span>
                <el-button v-if="keyword" size="small" text @click="keyword = ''">清空</el-button>
            </div>
            <el-radio-group v-model="filterField" size="small" class="filter-field">
                <el-radio-button v-for="opt in filterFieldOptions" :key="opt.value" :value="opt.value">
                    {{ opt.label }}
                </el-radio-button>
            </el-radio-group>
            <div class="filter-mode">
                <span class="filter-mode-label">模糊匹配</span>
                <el-switch v-model="fuzzyMatch" size="small" />
            </div>
            <el-input v-model="keyword" type="textarea" :autosize="{ minRows: 6, maxRows: 20 }" class="search-input"
                :placeholder="`一行一个 ${currentFieldLabel}，支持批量粘贴`" />
            <div class="summary">
                <template v-if="requestedValues.length">
                    <div class="summary-row">查询 <b>{{ requestedValues.length }}</b> 个 {{ currentFieldLabel }}</div>
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
            <div v-if="missingValues.length" class="missing-panel">
                <div class="missing-label">未找到的 {{ currentFieldLabel }}</div>
                <div class="missing-list">
                    <span v-for="v in missingValues" :key="v" class="missing-chip">{{ v }}</span>
                </div>
            </div>
        </aside>
        <div class="main-panel">
            <el-scrollbar v-if="activeWorkers.length > 0 && visibleRows.length > 0" class="grid-scrollbar">
                <div class="overview-grid" :style="gridStyle">
                    <div class="grid-index-header">#</div>
                    <div v-for="worker in activeWorkers" :key="worker.key" class="grid-col-header">
                        <span class="worker-name">{{ worker.name }}</span>
                        <span class="worker-count">{{ worker.wxaList.length }}</span>
                    </div>
                    <template v-for="(row, rowIndex) in visibleRows" :key="row.appid">
                        <div class="grid-index" :class="{ 'is-highlighted': row.highlighted }">
                            {{ rowIndex + 1 }}
                        </div>
                        <div v-for="worker in activeWorkers" :key="worker.key" class="grid-cell"
                            :class="{ 'is-empty': !getWxa(worker, row.appid), 'is-highlighted': row.highlighted }">
                            <WXAItem v-if="getWxa(worker, row.appid)" :wxa-item="getWxa(worker, row.appid)!">
                                <template #extra>
                                    <el-icon v-if="worker.markWXAppIds.includes(row.appid)" class="star-icon marked"
                                        @click="handleToggleMark(worker, row.appid, false)">
                                        <StarFilled />
                                    </el-icon>
                                    <el-icon v-else class="star-icon"
                                        @click="handleToggleMark(worker, row.appid, true)">
                                        <Star />
                                    </el-icon>
                                </template>
                            </WXAItem>
                        </div>
                    </template>
                </div>
            </el-scrollbar>
            <el-empty v-else class="empty-state"
                :description="activeWorkers.length === 0 ? '暂无已登录的账号' : '没有匹配的小程序'" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { Star, StarFilled } from '@element-plus/icons-vue';
import WXAItem from '@/baseComponent/WXAItem/index.vue';
import { requestGetWorkerList, requestGetWorkerDetail, requestMarkWXAppId } from '@/api';
import { WXWorkerN } from '@mp-assistant/common/dist/work';
import type { WXMPItem } from '@mp-assistant/common/dist/types/wx';
import { WSMessage } from '@mp-assistant/common/dist/ws/message.js';
import { WSMessageEvent } from '@/event/WSMessageEvent';

type FilterField = 'appid' | 'app_name' | 'username';

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

const activeWorkers = computed(() => workers.value.filter(w => w.isLogin));

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

const getWxa = (worker: WXWorkerN.WXWorkInfo, appid: string): WXMPItem | undefined => {
    return worker.wxaList.find(w => w.appid === appid);
};

const handleToggleMark = async (worker: WXWorkerN.WXWorkInfo, appid: string, mark: boolean) => {
    await requestMarkWXAppId(worker.key, { appId: appid, mark });
};

const gridStyle = computed(() => ({
    gridTemplateColumns: `56px repeat(${activeWorkers.value.length}, minmax(280px, 1fr))`,
}));

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
