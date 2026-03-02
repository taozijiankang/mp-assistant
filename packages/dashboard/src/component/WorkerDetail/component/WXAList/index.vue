<template>
    <div class="wxa-list">
        <div class="controller">
            <el-input v-model="searchValue" placeholder="请输入小程序名称或AppID进行搜索" clearable />
            <el-button type="primary"
                :loading="refreshWxaListLoading || workerDetail.loadings.includes(WXWorkerN.LoadingType.updateWxaListWxaList)"
                @click="handleRefreshWxaList">刷新小程序列表</el-button>
        </div>
        <el-scrollbar v-if="filteredWxaList.length > 0" class="wxa-item-container-scrollbar">
            <div class="wxa-item-container">
                <div class="wxa-item" v-for="wxa in filteredWxaList" :key="wxa.wxaItem.appid">
                    <div class="wxa-info-container">
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
                            {{ dayjs(taskInfo.result?.endTimestamp || 0).format('YYYY-MM-DD HH: mm: ss') }}
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
import { requestAddTask, requestWorkerUpdateWxaList } from '@/api';
import { useApiCall } from '@/hooks/useApiCall';
import type { WXMPItem } from 'mp-assistant-common/dist/types/wx';
import { WXWorkerN } from 'mp-assistant-common/dist/work';
import { TaskStatus, TaskStatusDict, TaskType, TaskTypeDict, WXTaskN, type BaseTaskInfo } from 'mp-assistant-common/dist/work/task';
import { ref, computed } from 'vue';
import VersionList from "./component/VersionList/index.vue"
import { dayjs } from 'element-plus';

const props = defineProps<{
    workerDetail: WXWorkerN.WXWorkInfo;
}>();

const emit = defineEmits<{
    (e: 'onRefreshWorkerDetail'): void;
}>();

const searchValue = ref('');

const restartTaskLoadings = ref<string[]>([]);

const filteredWxaList = computed(() => {
    const wxaList: WXMPItem[] = [];
    if (!searchValue.value) {
        wxaList.push(...props.workerDetail.wxaList);
    } else {
        wxaList.push(...props.workerDetail.wxaList.filter(wxa => wxa.app_name.includes(searchValue.value) || wxa.appid.includes(searchValue.value)));
    }
    return wxaList.map(item => {
        const relatedTask_ = [...props.workerDetail.taskList].sort((a, b) => b.startTime - a.startTime).filter(taskItem => {
            const options: WXTaskN.TaskOptions = taskItem.options;
            return options.app_name === item.app_name && options.username === item.username;
        });
        // 同一种类型的任务只能存在一个
        const relatedTask: BaseTaskInfo[] = [];
        for (const taskItem of relatedTask_) {
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
</script>

<style scoped lang="scss">
@use "./index.scss";
</style>