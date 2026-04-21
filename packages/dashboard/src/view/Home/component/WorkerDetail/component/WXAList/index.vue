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
            <span class="total-count">共 {{ filteredWxaList.length }} 条</span>
        </div>
        <el-scrollbar v-if="filteredWxaList.length > 0" class="wxa-item-container-scrollbar">
            <div class="wxa-item-container">
                <div class="wxa-item" :class="{ 'marked': workerDetail.markWXAppIds.includes(wxa.wxaItem.appid) }"
                    v-for="wxa in filteredWxaList" :key="wxa.wxaItem.appid">
                    <div class="wxa-item-header">
                        <WXAItem :wxa-item="wxa.wxaItem">
                            <template #name-suffix>
                                <el-button size="small" plain
                                    :loading="restartTaskLoadings.includes(wxa.wxaItem.appid) || wxa.inspectTaskVersionInfo?.status === TaskStatus.RUNNING"
                                    @click="handleRestartTask(wxa.wxaItem)">获取版本信息</el-button>
                            </template>
                            <template #extra>
                                <el-icon v-if="workerDetail.markWXAppIds.includes(wxa.wxaItem.appid)"
                                    class="star-icon marked" @click="handleMarkWXAppId(wxa.wxaItem.appid, false)">
                                    <StarFilled />
                                </el-icon>
                                <el-icon v-else class="star-icon" @click="handleMarkWXAppId(wxa.wxaItem.appid, true)">
                                    <Star />
                                </el-icon>
                            </template>
                        </WXAItem>
                    </div>
                    <div v-if="wxa.relatedTask.length > 0 || wxa.inspectTaskVersionInfo" class="wxa-item-body">
                        <div v-for="taskInfo in wxa.relatedTask" :key="taskInfo.key" class="task-info">
                            <div class="top">
                                <img v-if="taskInfo.type === TaskType.WX_INSPECT_VERSION"
                                    src="@/assets/check-the-version.png" alt="task-type-icon" class="task-type-icon">
                                <img v-if="taskInfo.type === TaskType.WX_AUDIT" src="@/assets/review.png"
                                    alt="task-type-icon" class="task-type-icon">
                                <img v-if="taskInfo.type === TaskType.WX_PUBLISH" src="@/assets/release.png"
                                    alt="task-type-icon" class="task-type-icon">
                                <span>{{ TaskTypeDict[taskInfo.type] }}</span>
                                <el-button class="view-task-button" link
                                    @click="handleViewTask(taskInfo)">查看</el-button>
                                <div class="task-status" :class="{
                                    'success': taskInfo.status === TaskStatus.COMPLETED,
                                    'running': taskInfo.status === TaskStatus.RUNNING,
                                    'fail': taskInfo.status === TaskStatus.FAILED,
                                }">
                                    <div class="dot"></div>
                                    <span>
                                        {{ TaskStatusDict[taskInfo.status] }}
                                    </span>
                                </div>
                                <span
                                    v-if="taskInfo.status === TaskStatus.COMPLETED || taskInfo.status === TaskStatus.FAILED"
                                    class="task-time">
                                    {{ dayjs(taskInfo.endTime).format('YYYY-MM-DD HH:mm:ss') }}
                                </span>
                            </div>
                        </div>
                        <VersionList v-if="wxa.inspectTaskVersionInfo" :wxmp-item="wxa.wxaItem"
                            :related-task="wxa.relatedTask" :inspect-version-task-info="wxa.inspectTaskVersionInfo" />
                    </div>
                </div>
            </div>
        </el-scrollbar>
        <div v-else class="no-data">
            <el-empty description="暂无数据" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { requestAddTask, requestMarkWXAppId, requestWorkerUpdateWxaList } from '@/api';
import { useApiCall } from '@/hooks/useApiCall';
import type { WXMPItem, WXReviewStatus } from '@mp-assistant/common/dist/types/wx';
import { WXWorkerN } from '@mp-assistant/common/dist/work';
import { TaskStatus, TaskStatusDict, TaskType, TaskTypeDict, WXTaskN, type BaseTaskInfo } from '@mp-assistant/common/dist/work/task';
import { ref, computed } from 'vue';
import VersionList from "./component/VersionList/index.vue"
import WXAItem from '@/component/WXAItem/index.vue';
import { dayjs } from 'element-plus';
import fuzzysort from 'fuzzysort';
import { WXReviewStatusDict } from '@mp-assistant/common/dist/constant';
import { useOperationRecordStore } from '@/stores';
import { Star, StarFilled } from '@element-plus/icons-vue';

const props = defineProps<{
    workerDetail: WXWorkerN.WXWorkInfo;
}>();

const emit = defineEmits<{
    (e: 'onRefreshWorkerDetail'): void;
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

const wxaList = computed(() => {
    return props.workerDetail.wxaList.map(item => {
        // 获取相关任务，按创建时间倒序，每种类型只保留最新一条
        const relatedTask: BaseTaskInfo[] = [];
        const relatedTaskSorted = props.workerDetail.taskList
            .filter(taskItem => {
                const options: WXTaskN.TaskOptions = taskItem.options;
                return options.appid === item.appid;
            })
            .sort((a, b) => b.createTime - a.createTime);
        for (const taskItem of relatedTaskSorted) {
            if (relatedTask.some(existing => existing.type === taskItem.type)) {
                continue;
            }
            relatedTask.push(taskItem);
        }

        const inspectTaskVersionInfo = relatedTask.find(
            taskItem => taskItem.type === TaskType.WX_INSPECT_VERSION
        ) as WXTaskN.InspectVersionInfo | undefined;

        return {
            wxaItem: item,
            relatedTask,
            inspectTaskVersionInfo,
        };
    });
});

const filteredWxaList = computed(() => {
    const markFilteredList = wxaList.value.filter(item => {
        if (markFilter.value === MarkFilter.All) {
            return true;
        }
        const isMarked = props.workerDetail.markWXAppIds.includes(item.wxaItem.appid);
        return markFilter.value === MarkFilter.Marked ? isMarked : !isMarked;
    });

    if (!searchValue.value) {
        return markFilteredList;
    }
    const fuzzysortKeys: {
        key: (item: { wxaItem: WXMPItem, inspectTaskVersionInfo: WXTaskN.InspectVersionInfo | undefined }) => string;
        weight: number;
    }[] = [
            {
                // 小程序名称
                key: item => item.wxaItem.app_name,
                weight: 3,
            },
            {
                // appid
                key: item => item.wxaItem.appid,
                weight: 2,
            },
            {
                // username
                key: item => item.wxaItem.username,
                weight: 1,
            },
            {
                // 审核状态
                key: item => {
                    const result = item.inspectTaskVersionInfo?.result?.data as WXTaskN.VersionListData | undefined;
                    // 审核版本
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

const operationRecordStore = useOperationRecordStore();

const handleViewTask = (taskInfo: BaseTaskInfo) => {
    operationRecordStore.setOnSelectedTaskKey(taskInfo.key);
};
</script>

<style scoped lang="scss">
@use "./index.scss";
</style>