<template>
    <div class="wxa-list">
        <div class="controller">
            <span class="total-count">{{ filteredWxaList.length }}</span>
            <el-input v-model="searchValue" placeholder="请输入过滤关键词 多个关键词用空格分隔" clearable />
            <el-button type="primary"
                :loading="refreshWxaListLoading || workerDetail.loadings.includes(WXWorkerN.LoadingType.updateWxaListWxaList)"
                @click="handleRefreshWxaList">刷新小程序列表</el-button>
        </div>
        <el-scrollbar v-if="filteredWxaList.length > 0" class="wxa-item-container-scrollbar">
            <div class="wxa-item-container">
                <div class="wxa-item" :class="{ 'marked': workerDetail.markWXAppIds.includes(wxa.wxaItem.appid) }"
                    v-for="wxa in filteredWxaList" :key="wxa.wxaItem.appid">
                    <div class="wxa-info-container">
                        <img v-if="workerDetail.markWXAppIds.includes(wxa.wxaItem.appid)" src="@/assets/mark.png"
                            alt="star" class="star-icon" @click="handleMarkWXAppId(wxa.wxaItem.appid, false)" />
                        <img v-else src="@/assets/no-mark.png" alt="star" class="star-icon"
                            @click="handleMarkWXAppId(wxa.wxaItem.appid, true)" />
                        <img class="wxa-icon" :src="wxa.wxaItem.app_headimg" />
                        <div class="wxa-info">
                            <div class="wxa-name">
                                <span>
                                    {{ wxa.wxaItem.app_name }}
                                </span>
                                <el-button size="small" plain
                                    :loading="restartTaskLoadings.includes(wxa.wxaItem.appid) || wxa.inspectTaskVersionInfo?.status === TaskStatus.RUNNING"
                                    @click="handleRestartTask(wxa.wxaItem)">检测版本信息</el-button>
                            </div>
                            <div class="wxa-appid">appid: {{ wxa.wxaItem.appid }}</div>
                            <div class="wxa-username">username: {{ wxa.wxaItem.username }}</div>
                        </div>
                    </div>
                    <div v-for="taskInfo in wxa.relatedTask" class="task-info">
                        <div class="top">
                            <img v-if="taskInfo.type === TaskType.WX_INSPECT_VERSION"
                                src="@/assets/check-the-version.png" alt="task-type-icon" class="task-type-icon">
                            <img v-if="taskInfo.type === TaskType.WX_AUDIT" src="@/assets/review.png"
                                alt="task-type-icon" class="task-type-icon">
                            <img v-if="taskInfo.type === TaskType.WX_PUBLISH" src="@/assets/release.png"
                                alt="task-type-icon" class="task-type-icon">
                            <span>{{ TaskTypeDict[taskInfo.type] }}</span>
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
                        </div>
                        <span>
                            {{ taskInfo.key }}
                            <span
                                v-if="taskInfo.status === TaskStatus.COMPLETED || taskInfo.status === TaskStatus.FAILED">

                                {{ dayjs(taskInfo.endTime).format('YYYY-MM-DD HH: mm: ss') }}
                            </span>
                        </span>
                    </div>
                    <VersionList v-if="wxa.inspectTaskVersionInfo" :wxmp-item="wxa.wxaItem"
                        :related-task="wxa.relatedTask" :inspect-version-task-info="wxa.inspectTaskVersionInfo" />
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
import { dayjs } from 'element-plus';
import fuzzysort from 'fuzzysort';
import { WXReviewStatusDict } from '@mp-assistant/common/dist/constant';

const props = defineProps<{
    workerDetail: WXWorkerN.WXWorkInfo;
}>();

const emit = defineEmits<{
    (e: 'onRefreshWorkerDetail'): void;
}>();

const searchValue = ref('');

const restartTaskLoadings = ref<string[]>([]);

const wxaList = computed(() => {
    return props.workerDetail.wxaList.map(item => {
        // 获取相关任务
        const relatedTask_ = props.workerDetail.taskList.filter(taskItem => {
            const options: WXTaskN.TaskOptions = taskItem.options;
            return options.app_name === item.app_name && options.username === item.username;
        });

        // 同一种类型的任务只能存在一个
        const relatedTask: BaseTaskInfo[] = [];
        for (const taskItem of relatedTask_.sort((a, b) => b.createTime - a.createTime)) {
            const alreadyTask = relatedTask.find(taskItem_ => taskItem_.type === taskItem.type);
            if (alreadyTask) {
                continue;
            }
            relatedTask.push(taskItem);
        }

        return {
            wxaItem: item,
            relatedTask,
            inspectTaskVersionInfo: relatedTask.find(taskItem => taskItem.type === TaskType.WX_INSPECT_VERSION) as WXTaskN.InspectVersionInfo | undefined,
            auditTaskInfo: relatedTask.find(taskItem => taskItem.type === TaskType.WX_AUDIT) as WXTaskN.TaskInfo | undefined,
            publishTaskInfo: relatedTask.find(taskItem => taskItem.type === TaskType.WX_PUBLISH) as WXTaskN.TaskInfo | undefined,
        };
    });
});

const filteredWxaList = computed(() => {
    if (!searchValue.value) {
        return wxaList.value;
    }
    const fuzzysortKeys: {
        key: (item: { wxaItem: WXMPItem, inspectTaskVersionInfo: WXTaskN.InspectVersionInfo | undefined }) => string;
        weight: number;
    }[] = [
            {
                key: item => props.workerDetail.markWXAppIds.includes(item.wxaItem.appid) ? '已标记' : '未标记',
                weight: 4,
            },
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
    return fuzzysort.go(searchValue.value, wxaList.value, {
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
        app_name: wxa.app_name,
        username: wxa.username,
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
</script>

<style scoped lang="scss">
@use "./index.scss";
</style>