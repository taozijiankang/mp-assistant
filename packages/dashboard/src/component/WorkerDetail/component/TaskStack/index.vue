<template>
    <div class="task-stack">
        <div class="task-list">
            <div class="controller">
                <el-input v-model="filterKeyword" placeholder="请输入过滤关键词，支持小程序名称、appid、username" clearable />
                <el-button type="primary" @click="handleAddTask">添加任务</el-button>
            </div>
            <el-scrollbar class="task-list-content-scrollbar">
                <div class="task-list-content">
                    <div v-for="taskItem in [...filteredTaskList].reverse()" :key="taskItem.key" class="task-item"
                        :class="{
                            selected: taskItem.key === onSelectedTaskKey,
                            'not-started': taskItem.status === TaskStatus.NOT_STARTED,
                            running: taskItem.status === TaskStatus.RUNNING,
                            completed: taskItem.status === TaskStatus.COMPLETED,
                            failed: taskItem.status === TaskStatus.FAILED,
                        }" @click="handleTaskClick(taskItem)">
                        <div class="main">
                            <span class="task-type">{{ TaskTypeDict[taskItem.type] }} 任务</span>
                            <div class="task-status">
                                <span class="dot"></span>
                                <span>
                                    {{ TaskStatusDict[taskItem.status] }}
                                </span>
                            </div>
                        </div>
                        <div v-if="getWxaInfo(taskItem.options)" class="wxa-info-container">
                            <img class="wxa-icon" :src="getWxaInfo(taskItem.options)?.app_headimg" />
                            <div class="wxa-info">
                                <div class="wxa-name">{{ getWxaInfo(taskItem.options)?.app_name }}</div>
                                <div class="wxa-appid">appid: {{ getWxaInfo(taskItem.options)?.appid }}</div>
                                <div class="wxa-username">username: {{ getWxaInfo(taskItem.options)?.username }}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </el-scrollbar>
        </div>
        <div v-if="onSelectedTask" class="task-detail">
            <div v-if="onSelectedTask.status === TaskStatus.RUNNING" class="task-running">
                <span>任务执行中...</span>
            </div>
            <template
                v-if="onSelectedTask.status === TaskStatus.COMPLETED || onSelectedTask.status === TaskStatus.FAILED">
                <div class="title">
                    <span>任务结果</span>
                </div>
                <div class="task-result-content">
                    <div class="task-result" :class="{
                        'completed': onSelectedTask.result?.status === TaskStatus.COMPLETED,
                        'failed': onSelectedTask.result?.status === TaskStatus.FAILED,
                    }">
                        <span>{{ TaskStatusDict[onSelectedTask.result?.status || TaskStatus.NOT_STARTED] }}</span>
                    </div>
                    <div class="task-result-time">
                        <span>
                            结束时间：{{ dayjs(onSelectedTask.result?.endTimestamp || 0).format('YYYY-MM-DD HH:mm:ss') }}
                        </span>
                    </div>
                    <div v-if="onSelectedTask.result?.msg" class="result-msg">
                        <span>{{ onSelectedTask.result?.msg }}</span>
                    </div>
                </div>
            </template>
            <div class="title">
                <span>任务运行报告</span>
            </div>
            <el-timeline v-if="onSelectedTask.runningReportList.length > 0" class="report-timeline" reverse>
                <el-timeline-item v-for="(taskReport, index) in onSelectedTask.runningReportList" :key="index"
                    :timestamp="dayjs(taskReport.timestamp).format('YYYY-MM-DD HH:mm:ss')" placement="top">
                    <div class="report-item">
                        <span class="report-item-title">{{ taskReport.title }}</span>
                        <span v-if="taskReport.description" class="report-item-description">
                            {{ taskReport.description }}
                        </span>
                        <div v-if="taskReport.images && taskReport.images.length > 0" class="report-item-images">
                            <img v-for="image in taskReport.images" :key="image" :src="image" />
                        </div>
                    </div>
                </el-timeline-item>
            </el-timeline>
            <el-empty v-else description="暂无任务运行报告" />
        </div>
        <AddTaskDialog ref="addTaskDialogRef" />
    </div>
</template>

<script setup lang="ts">
import { TaskStatus, TaskStatusDict, TaskTypeDict, WXTaskN, type BaseTaskInfo } from 'mp-assistant-common/dist/work/task';
import { ref, computed } from 'vue';
import AddTaskDialog from '../AddTaskDialog/index.vue';
import { dayjs } from 'element-plus';
import { WXWorkerN } from 'mp-assistant-common/dist/work';
import { useOperationRecordStore } from '@/stores';
import { storeToRefs } from 'pinia';

const props = defineProps<{
    workerDetail: WXWorkerN.WXWorkInfo
}>();

const operationRecordStore = useOperationRecordStore();
const { onSelectedTaskKey } = storeToRefs(operationRecordStore);

const addTaskDialogRef = ref<InstanceType<typeof AddTaskDialog>>();

const filterKeyword = ref('');

const onSelectedTask = computed(() => {
    return props.workerDetail.taskList.find(task => task.key === onSelectedTaskKey.value);
});

const filteredTaskList = computed(() => {
    if (!filterKeyword.value) {
        return props.workerDetail.taskList;
    }
    return props.workerDetail.taskList;
});

const handleAddTask = () => {
    addTaskDialogRef.value?.open(props.workerDetail.key);
}

const handleTaskClick = (taskItem: BaseTaskInfo) => {
    operationRecordStore.setOnSelectedTaskKey(taskItem.key);
}

const getWxaInfo = (options: WXTaskN.TaskOptions) => {
    return props.workerDetail.wxaList.find(wxa => wxa.username === options.username && wxa.app_name === options.app_name);
}

</script>

<style scoped lang="scss">
@use "./index.scss";
</style>