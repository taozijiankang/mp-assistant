<template>
    <div class="wxa-list">
        <div class="controller">
            <el-input v-model="searchValue" placeholder="请输入过滤关键词 多个关键词用空格分隔" clearable />
            <el-button type="primary"
                :loading="refreshWxaListLoading || workerDetail.loadings.includes(WXWorkerN.LoadingType.updateWxaListWxaList)"
                @click="handleRefreshWxaList">刷新小程序列表</el-button>
        </div>
        <div class="filter-bar">
            <el-radio-group v-model="markFilter" size="small">
                <el-radio-button :value="MarkFilter.All">全部</el-radio-button>
                <el-radio-button :value="MarkFilter.Marked">已标记 {{ markedCount }}</el-radio-button>
                <el-radio-button :value="MarkFilter.Unmarked">未标记</el-radio-button>
            </el-radio-group>
            <div class="filter-bar-right">
                <el-button size="small" text type="danger" :disabled="!hasAnyMark" :loading="clearAllMarkLoading"
                    @click="handleClearAllMark">清空全部标记</el-button>
                <span class="total-count">共 {{ filteredWxaList.length }} 条</span>
            </div>
        </div>
        <div v-if="filteredWxaList.length > 0" class="wxa-table-wrap">
            <el-table class="wxa-table" :data="filteredWxaList" :row-key="wxaRowKey" border stripe height="100%">
                <el-table-column fixed="left" label="小程序信息" width="320" class-name="wxa-info-column">
                    <template #default="{ row }: WxaTableColumnScope">
                        <div class="wxa-info-cell">
                            <div class="wxa-info-header">
                                <WXAItem :wxa-item="row.wxaItem">
                                    <template #extra>
                                        <el-icon v-if="workerDetail.markWXAppIds.includes(row.wxaItem.appid)"
                                            class="star-icon marked"
                                            @click="handleMarkWXAppId(row.wxaItem.appid, false)">
                                            <StarFilled />
                                        </el-icon>
                                        <el-icon v-else class="star-icon"
                                            @click="handleMarkWXAppId(row.wxaItem.appid, true)">
                                            <Star />
                                        </el-icon>
                                    </template>
                                </WXAItem>
                            </div>
                            <div class="wxa-fetch-version-row">
                                <el-button size="small" plain
                                    :loading="restartTaskLoadings.includes(row.wxaItem.appid) || row.inspectTaskVersionInfo?.status === TaskStatus.RUNNING"
                                    @click="handleRestartTask(row.wxaItem)">获取版本信息</el-button>
                            </div>
                            <div v-if="row.relatedTask.length > 0" class="wxa-info-tasks">
                                <div v-for="taskInfo in row.relatedTask" :key="taskInfo.key" class="task-info">
                                    <div class="top">
                                        <img v-if="taskInfo.type === TaskType.WX_INSPECT_VERSION"
                                            src="@/assets/check-the-version.png" alt="task-type-icon"
                                            class="task-type-icon">
                                        <img v-if="taskInfo.type === TaskType.WX_AUDIT" src="@/assets/review.png"
                                            alt="task-type-icon" class="task-type-icon">
                                        <img v-if="taskInfo.type === TaskType.WX_PUBLISH" src="@/assets/release.png"
                                            alt="task-type-icon" class="task-type-icon">
                                        <span>{{ taskTypeLabel(taskInfo) }}</span>
                                        <el-button class="view-task-button" link
                                            @click="handleViewTask(taskInfo)">查看</el-button>
                                        <div class="task-status" :class="{
                                            'success': taskInfo.status === TaskStatus.COMPLETED,
                                            'running': taskInfo.status === TaskStatus.RUNNING,
                                            'fail': taskInfo.status === TaskStatus.FAILED,
                                        }">
                                            <div class="dot"></div>
                                            <span>
                                                {{ taskStatusLabel(taskInfo) }}
                                            </span>
                                        </div>
                                        <span
                                            v-if="taskInfo.status === TaskStatus.COMPLETED || taskInfo.status === TaskStatus.FAILED"
                                            class="task-time">
                                            {{ dayjs(taskInfo.endTime).format('YYYY-MM-DD HH:mm:ss') }}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column label="线上版本" :min-width="versionColWidth.online" align="left">
                    <template #default="{ row }: WxaTableColumnScope">
                        <div v-if="row.inspectTaskVersionInfo" class="version-cell">
                            <div v-if="onlineVersions(row).length" class="version-card-list"
                                :style="versionCardListStyle">
                                <div v-for="(v, idx) in onlineVersions(row)" :key="`${row.wxaItem.appid}-online-${idx}`"
                                    class="version-card-wrap" :style="versionCardWrapStyle">
                                    <VersionCard :item="v" :version-type="WXTaskN.VersionType.ONLINE"
                                        :wxmp-item="row.wxaItem" :related-task="row.relatedTask"
                                        :online-version="onlineRef(row)" />
                                </div>
                            </div>
                            <div v-else class="version-cell-empty">暂无</div>
                        </div>
                        <div v-else class="version-cell-placeholder">请先获取版本信息</div>
                    </template>
                </el-table-column>
                <el-table-column label="审核版本" :min-width="versionColWidth.audit" align="left">
                    <template #default="{ row }: WxaTableColumnScope">
                        <div v-if="row.inspectTaskVersionInfo" class="version-cell">
                            <div v-if="auditVersions(row).length" class="version-card-list"
                                :style="versionCardListStyle">
                                <div v-for="(v, idx) in auditVersions(row)" :key="`${row.wxaItem.appid}-audit-${idx}`"
                                    class="version-card-wrap" :style="versionCardWrapStyle">
                                    <VersionCard :item="v" :version-type="WXTaskN.VersionType.TEST"
                                        :wxmp-item="row.wxaItem" :related-task="row.relatedTask"
                                        :online-version="onlineRef(row)" />
                                </div>
                            </div>
                            <div v-else class="version-cell-empty">暂无</div>
                        </div>
                        <div v-else class="version-cell-placeholder">请先获取版本信息</div>
                    </template>
                </el-table-column>
                <el-table-column label="开发版本" :min-width="versionColWidth.dev" align="left">
                    <template #default="{ row }: WxaTableColumnScope">
                        <div v-if="row.inspectTaskVersionInfo" class="version-cell">
                            <div v-if="devVersions(row).length" class="version-card-list" :style="versionCardListStyle">
                                <div v-for="(v, idx) in devVersions(row)" :key="`${row.wxaItem.appid}-dev-${idx}`"
                                    class="version-card-wrap" :style="versionCardWrapStyle">
                                    <VersionCard :item="v" :version-type="WXTaskN.VersionType.DEVELOP"
                                        :wxmp-item="row.wxaItem" :related-task="row.relatedTask"
                                        :online-version="onlineRef(row)" />
                                </div>
                            </div>
                            <div v-else class="version-cell-empty">暂无</div>
                        </div>
                        <div v-else class="version-cell-placeholder">请先获取版本信息</div>
                    </template>
                </el-table-column>
            </el-table>
        </div>
        <div v-else class="no-data">
            <el-empty description="暂无数据" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { requestAddTask, requestClearAllMarkWXAppIds, requestMarkWXAppId, requestWorkerUpdateWxaList } from '@/api';
import { useApiCall } from '@/hooks/useApiCall';
import type { WXMPItem, WXReviewStatus, VersionListItem } from '@mp-assistant/common/dist/types/wx';
import { WXWorkerN } from '@mp-assistant/common/dist/work';
import { TaskStatus, TaskStatusDict, TaskType, TaskTypeDict, WXTaskN, type BaseTaskInfo } from '@mp-assistant/common/dist/work/task';
import { ref, computed } from 'vue';
import VersionCard from "./component/VersionCard/index.vue";
import WXAItem from '@/component/WXAItem/index.vue';
import { dayjs, ElMessageBox } from 'element-plus';
import fuzzysort from 'fuzzysort';
import { WXReviewStatusDict } from '@mp-assistant/common/dist/constant';
import { Star, StarFilled } from '@element-plus/icons-vue';

type WxaListRow = {
    wxaItem: WXMPItem;
    relatedTask: BaseTaskInfo[];
    inspectTaskVersionInfo?: WXTaskN.InspectVersionInfo;
};

/** 与 `el-table` 的 `:data` 行类型对齐的列默认插槽作用域（便于模板内维护） */
type WxaTableColumnScope = {
    row: WxaListRow;
    $index: number;
};

const props = defineProps<{
    workerDetail: WXWorkerN.WXWorkInfo;
}>();

const emit = defineEmits<{
    (e: 'onRefreshWorkerDetail'): void;
    (e: 'update:selectedTaskKey', key: string): void;
}>();

const searchValue = ref('');

enum MarkFilter {
    All = 'all',
    Marked = 'marked',
    Unmarked = 'unmarked',
}
const markFilter = ref<MarkFilter>(MarkFilter.All);

const restartTaskLoadings = ref<string[]>([]);

const markedCount = computed(() => {
    return props.workerDetail.wxaList.filter(item =>
        props.workerDetail.markWXAppIds.includes(item.appid)
    ).length;
});

const hasAnyMark = computed(() => props.workerDetail.markWXAppIds.length > 0);

const wxaList = computed((): WxaListRow[] => {
    return props.workerDetail.wxaList.map(item => {
        const sortedForApp = props.workerDetail.taskList
            .filter(taskItem => {
                const options: WXTaskN.TaskOptions = taskItem.options;
                return options.appid === item.appid;
            })
            .sort((a, b) => b.createTime - a.createTime);

        const relatedTask: BaseTaskInfo[] = [];
        for (const taskItem of sortedForApp) {
            if (
                taskItem.type === TaskType.WX_INSPECT_VERSION &&
                taskItem.status === TaskStatus.COMPLETED &&
                relatedTask.some(
                    t =>
                        t.type === TaskType.WX_INSPECT_VERSION &&
                        t.status === TaskStatus.COMPLETED
                )
            ) {
                continue;
            }
            relatedTask.push(taskItem);
        }

        const inspectTaskVersionInfo = props.workerDetail.taskList
            .filter(taskItem => {
                const options: WXTaskN.TaskOptions = taskItem.options;
                return (
                    options.appid === item.appid &&
                    taskItem.type === TaskType.WX_INSPECT_VERSION &&
                    taskItem.status === TaskStatus.COMPLETED
                );
            })
            .sort((a, b) => b.createTime - a.createTime)[0] as
            | WXTaskN.InspectVersionInfo
            | undefined;

        return {
            wxaItem: item,
            relatedTask,
            inspectTaskVersionInfo,
        };
    });
});

const versionData = (row: WxaListRow) =>
    row.inspectTaskVersionInfo?.result?.data as WXTaskN.VersionListData | undefined;

const onlineRef = (row: WxaListRow): VersionListItem | null =>
    versionData(row)?.[WXTaskN.VersionType.ONLINE] ?? null;

const onlineVersions = (row: WxaListRow): VersionListItem[] => {
    const o = onlineRef(row);
    return o ? [o] : [];
};

const auditVersions = (row: WxaListRow): VersionListItem[] => {
    const t = versionData(row)?.[WXTaskN.VersionType.TEST];
    return t?.audit_status ? [t] : [];
};

const devVersions = (row: WxaListRow): VersionListItem[] => {
    const list = versionData(row)?.[WXTaskN.VersionType.DEVELOP] ?? [];
    return [...list].sort((a, b) => {
        const an = a.nick_name?.trim() ?? '';
        const bn = b.nick_name?.trim() ?? '';
        return an.localeCompare(bn, 'zh-CN', { numeric: true });
    });
};

const wxaRowKey = (row: WxaListRow) => row.wxaItem.appid;

/** 与行内 `versionCardWrapStyle` / `versionCardListStyle`、`versionColWidth` 一致。 */
const VERSION_CARD_WIDTH = 380;
const VERSION_CARD_LIST_GAP = 8;
/** el-table 单元格左右 padding 各 12px，列 `min-width` 需在内容宽基础上加两侧。 */
const TABLE_CELL_PADDING_X = 12 * 2;

const versionCardWrapStyle = {
    width: `${VERSION_CARD_WIDTH}px`,
};

const versionCardListStyle = {
    gap: `${VERSION_CARD_LIST_GAP}px`,
};

const filteredWxaList = computed(() => {
    const markFilteredList = wxaList.value.filter(item => {
        if (markFilter.value === MarkFilter.All) {
            return true;
        }
        const isMarked = props.workerDetail.markWXAppIds.includes(item.wxaItem.appid);
        return markFilter.value === MarkFilter.Marked ? isMarked : !isMarked;
    });

    if (!searchValue.value) {
        return markFilteredList.slice().sort((a, b) =>
            a.wxaItem.app_name.localeCompare(b.wxaItem.app_name, 'zh-CN', { numeric: true }),
        );
    }
    const fuzzysortKeys: {
        key: (item: WxaListRow) => string;
        weight: number;
    }[] = [
            {
                key: item => item.wxaItem.app_name,
                weight: 3,
            },
            {
                key: item => item.wxaItem.appid,
                weight: 2,
            },
            {
                key: item => item.wxaItem.username,
                weight: 1,
            },
            {
                key: item => {
                    const result = item.inspectTaskVersionInfo?.result?.data as WXTaskN.VersionListData | undefined;
                    const auditVersion = result?.[WXTaskN.VersionType.TEST];
                    return WXReviewStatusDict[auditVersion?.audit_status as WXReviewStatus] || '';
                },
                weight: 1,
            },
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

const colW = (n: number) => {
    const c = Math.min(Math.max(1, n), 3);
    return VERSION_CARD_WIDTH * c + VERSION_CARD_LIST_GAP * (c - 1) + TABLE_CELL_PADDING_X +
        // 为了保证卡片之间有足够的间距
        2;
};

const versionColWidth = computed(() => {
    const rows = filteredWxaList.value.filter((r) => r.inspectTaskVersionInfo);
    if (rows.length === 0) {
        return { online: colW(1), audit: colW(1), dev: colW(1) };
    }
    const m = (fn: (r: WxaListRow) => number) => Math.max(1, ...rows.map(fn));
    return {
        online: colW(m((r) => onlineVersions(r).length)),
        audit: colW(m((r) => auditVersions(r).length)),
        dev: colW(m((r) => devVersions(r).length)),
    };
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
        appid: wxa.appid,
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

const handleMarkWXAppId = async (appId: string, mark: boolean) => {
    await requestMarkWXAppId(props.workerDetail.key, {
        appId,
        mark,
    });
};

const { loading: clearAllMarkLoading, call: clearAllMark } = useApiCall(() =>
    requestClearAllMarkWXAppIds(props.workerDetail.key)
);

const handleClearAllMark = () => {
    ElMessageBox.confirm('确定清除当前 Worker 下所有小程序的标记吗？', '提示', {
        type: 'warning',
        confirmButtonText: '确定',
        cancelButtonText: '取消',
    }).then(() => {
        void clearAllMark();
    });
};

const handleViewTask = (taskInfo: BaseTaskInfo) => {
    emit('update:selectedTaskKey', taskInfo.key);
};

const taskTypeLabel = (task: BaseTaskInfo) => TaskTypeDict[task.type as TaskType];

const taskStatusLabel = (task: BaseTaskInfo) => TaskStatusDict[task.status as TaskStatus];
</script>

<style scoped lang="scss">
@use "./index.scss";
</style>
