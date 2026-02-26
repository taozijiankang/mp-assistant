<template>
    <div class="task-stack">
        <div class="task-list">
            <div class="controller">
                <el-input v-model="filterKeyword" placeholder="请输入过滤关键词，支持小程序名称、appid、username" clearable />
                <el-button type="primary" @click="handleAddTask">添加任务</el-button>
            </div>
            <div class="task-list-content">
                <div v-for="taskItem in [...filteredTaskList].reverse()" :key="taskItem.key" class="task-item" :class="{
                    selected: taskItem.key === onSelectedTaskKey,
                    'not-started': taskItem.status === TaskStatus.NOT_STARTED,
                    running: taskItem.status === TaskStatus.RUNNING,
                    completed: taskItem.status === TaskStatus.COMPLETED,
                    failed: taskItem.status === TaskStatus.FAILED,
                }" @click="handleTaskClick(taskItem)">
                    <div class="main">
                        <span class="task-type">{{ TaskTypeDict[taskItem.type] }} 任务</span>
                        <div class="task-status">{{ TaskStatusDict[taskItem.status] }}</div>
                    </div>
                    <div v-if="WXTaskN.isWXTaskInfo(taskItem)" class="task-options">
                        <img v-if="getWxaInfo(taskItem.options)" class="app-icon"
                            :src="getWxaInfo(taskItem.options)?.app_headimg" />
                        <span>{{ taskItem.options.app_name }} ({{ taskItem.options.username }})</span>
                    </div>
                </div>
            </div>
        </div>
        <div v-if="onSelectedTask" class="task-report">
            <div class="report-title">任务详情</div>
            <el-timeline class="report-timeline">
                <el-timeline-item v-for="(taskReport, index) in onSelectedTask.runningReportList" :key="index"
                    :timestamp="dayjs(taskReport.timestamp).format('YYYY-MM-DD HH:mm:ss')" placement="top">
                    <div>
                        <h4>{{ taskReport.title }}</h4>
                        <p>{{ taskReport.description }}</p>
                    </div>
                </el-timeline-item>
            </el-timeline>
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