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
                }" @click="onSelectedTaskKey = taskItem.key">
                    <div class="main">
                        <span class="task-type">{{ TaskTypeDict[taskItem.type] }} 任务</span>
                        <div class="task-status">{{ TaskStatusDict[taskItem.status] }}</div>
                    </div>
                    <div v-if="isWXTaskInfo(taskItem)" class="task-options">
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
import { isWXTaskInfo, TaskStatus, TaskStatusDict, TaskTypeDict } from 'mp-assistant-common/dist/work/task';
import type { WXWorkInfo } from 'mp-assistant-common/dist/work/type';
import { ref, computed } from 'vue';
import AddTaskDialog from '../AddTaskDialog/index.vue';
import type { WXTask } from 'mp-assistant-common/dist/work/task/type';
import { dayjs } from 'element-plus';

const props = defineProps<{
    workerDetail: WXWorkInfo
}>();

const addTaskDialogRef = ref<InstanceType<typeof AddTaskDialog>>();

const filterKeyword = ref('');

const onSelectedTaskKey = ref<string>('');

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

const getWxaInfo = (options: WXTask.TaskOptions) => {
    return props.workerDetail.wxaList.find(wxa => wxa.username === options.username && wxa.app_name === options.app_name);
}
</script>

<style scoped lang="scss">
@use "./index.scss";
</style>