<template>
    <div class="task-stack">
        <div class="task-list">
            <div class="controller">
                <el-input v-model="filterKeyword" placeholder="请输入过滤关键词，支持小程序名称、appid、username" clearable />
                <el-button type="primary" @click="handleAddTask?.()">添加任务</el-button>
            </div>
            <div class="filter">
                <div v-for="item in filterStatusOptions" :key="item.value" class="filter-item" :class="{
                    'total': item.value === 'all',
                    'running': item.value === TaskStatus.RUNNING,
                    'completed': item.value === TaskStatus.COMPLETED,
                    'failed': item.value === TaskStatus.FAILED,
                    'not-started': item.value === TaskStatus.NOT_STARTED,
                    'selected': item.value === filterStatus,
                }" @click="filterStatus = item.value">
                    <span>{{ item.label }}</span>
                    <span>{{taskList.filter(task => item.value === 'all' || task.status ===
                        item.value).length}}</span>
                </div>
            </div>
            <el-scrollbar v-if="filteredTaskList.length > 0" class="task-list-content-scrollbar">
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
                            <div class="task-type-container">
                                <img v-if="taskItem.type === TaskType.WX_INSPECT_VERSION"
                                    src="@/assets/check-the-version.png" alt="task-type-icon" class="task-type-icon">
                                <img v-if="taskItem.type === TaskType.WX_AUDIT" src="@/assets/review.png"
                                    alt="task-type-icon" class="task-type-icon">
                                <img v-if="taskItem.type === TaskType.WX_PUBLISH" src="@/assets/release.png"
                                    alt="task-type-icon" class="task-type-icon">
                                <span class="task-type">{{ TaskTypeDict[taskItem.type] }} 任务</span>
                            </div>
                            <div class="task-status">
                                <span class="dot"></span>
                                <span>
                                    {{ TaskStatusDict[taskItem.status] }}
                                </span>
                            </div>
                        </div>
                        <div class="task-key">
                            <span>{{ taskItem.key }}</span>
                        </div>
                        <div v-if="getWxaInfo(taskItem.options)" class="wxa-info-container">
                            <img class="wxa-icon" :src="getWxaInfo(taskItem.options)?.app_headimg" />
                            <div class="wxa-info">
                                <div class="wxa-name">{{ getWxaInfo(taskItem.options)?.app_name }}</div>
                                <div class="wxa-appid">appid: {{ getWxaInfo(taskItem.options)?.appid }}</div>
                                <div class="wxa-username">username: {{ getWxaInfo(taskItem.options)?.username }}</div>
                            </div>
                        </div>
                        <div v-if="WXTaskN.isPublishInfo(taskItem)" class="publish-qrcode-container">
                            <span class="publish-qrcode-description">需要扫描二维码进行发布 剩余时间: {{ Math.round(taskItem.countdown)
                                }}秒</span>
                            <img :src="getFileUrl(taskItem.publishQRCodeFilePath)" alt="publish-qrcode"
                                class="publish-qrcode-image" />
                        </div>
                        <div v-if="taskItem.status !== TaskStatus.RUNNING" class="item-controller">
                            <el-button class="file-remove-button" size="small" type="danger" plain
                                :loading="removeTaskLoadings.includes(taskItem.key)"
                                @click="handleDestroyTask(taskItem)" circle>
                                <el-icon>
                                    <Delete />
                                </el-icon>
                            </el-button>
                        </div>
                    </div>
                </div>
            </el-scrollbar>
            <div v-else class="no-data">
                <el-empty description="暂无数据" />
            </div>
        </div>
        <el-scrollbar v-if="onSelectedTask" class="task-detail-scrollbar">
            <div v-if="onSelectedTask" class="task-detail">
                <div v-if="onSelectedTask.status === TaskStatus.RUNNING" class="task-running">
                    <div class="dot"></div>
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
                <el-timeline v-if="onSelectedTask.runningReportList.length > 0" class="report-timeline">
                    <el-timeline-item v-for="(taskReport, index) in onSelectedTask.runningReportList" :key="index"
                        :timestamp="dayjs(taskReport.timestamp).format('YYYY-MM-DD HH:mm:ss')" placement="top">
                        <div class="report-item">
                            <span class="report-item-title">{{ taskReport.title }}</span>
                            <span v-if="taskReport.description" class="report-item-description">
                                {{ taskReport.description }}
                            </span>
                            <div v-if="taskReport.images && taskReport.images.length > 0" class="report-item-images">
                                <el-image v-for="(image, index) in taskReport.images.map(image => getFileUrl(image))"
                                    :key="image" :src="image" fit="contain"
                                    :preview-src-list="taskReport.images.map(image => getFileUrl(image))"
                                    preview-teleported :initial-index="index" />
                            </div>
                        </div>
                    </el-timeline-item>
                </el-timeline>
                <el-empty v-else description="暂无任务运行报告" />
            </div>
        </el-scrollbar>
    </div>
</template>

<script setup lang="ts">
import { TaskStatus, TaskStatusDict, TaskType, TaskTypeDict, WXTaskN, type BaseTaskInfo } from 'mp-assistant-common/dist/work/task';
import { ref, computed, inject } from 'vue';
import { dayjs, ElMessageBox } from 'element-plus';
import { WXWorkerN } from 'mp-assistant-common/dist/work';
import { useOperationRecordStore } from '@/stores';
import { storeToRefs } from 'pinia';
import { Delete } from '@element-plus/icons-vue';
import { getFileUrl, requestRemoveTask } from '@/api';
import type { AddTaskFormData } from '../AddTaskDialog/index';

const props = defineProps<{
    workerDetail: WXWorkerN.WXWorkInfo;
}>();

const handleAddTask = inject<(formData?: AddTaskFormData) => void>('handleAddTask');

const operationRecordStore = useOperationRecordStore();
const { onSelectedTaskKey } = storeToRefs(operationRecordStore);

const removeTaskLoadings = ref<string[]>([]);

const filterKeyword = ref('');
const filterStatus = ref<TaskStatus | 'all'>('all');

const filterStatusOptions = computed<{
    label: string;
    value: TaskStatus | 'all';
}[]>(() => {
    return [
        {
            label: '全部',
            value: 'all',
        },
        {
            label: '未开始',
            value: TaskStatus.NOT_STARTED,
        },
        {
            label: '执行中',
            value: TaskStatus.RUNNING,
        },
        {
            label: '完成',
            value: TaskStatus.COMPLETED,
        },
        {
            label: '失败',
            value: TaskStatus.FAILED,
        },
    ];
});

const onSelectedTask = computed(() => {
    return props.workerDetail.taskList.find(task => task.key === onSelectedTaskKey.value);
});

const taskList = computed(() => {
    return [...props.workerDetail.taskList].sort((a, b) => a.startTime - b.startTime);
});

const filteredTaskList = computed(() => {
    let list = taskList.value;
    if (filterKeyword.value) {
        list = list.filter(task => task.key.includes(filterKeyword.value));
    }
    if (filterStatus.value !== 'all') {
        list = list.filter(task => task.status === filterStatus.value);
    }
    return list;
});

const handleTaskClick = (taskItem: BaseTaskInfo) => {
    operationRecordStore.setOnSelectedTaskKey(taskItem.key);
}

const getWxaInfo = (options: WXTaskN.TaskOptions) => {
    return props.workerDetail.wxaList.find(wxa => wxa.username === options.username && wxa.app_name === options.app_name);
}

const handleDestroyTask = (taskItem: BaseTaskInfo) => {
    if (removeTaskLoadings.value.includes(taskItem.key)) {
        return;
    }
    ElMessageBox.confirm('确定删除该任务吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
    }).then(async () => {
        removeTaskLoadings.value.push(taskItem.key);
        try {
            await requestRemoveTask(props.workerDetail.key, taskItem.key);
        } finally {
            removeTaskLoadings.value = removeTaskLoadings.value.filter(key => key !== taskItem.key);
        }
    });
};

</script>

<style scoped lang="scss">
@use "./index.scss";
</style>