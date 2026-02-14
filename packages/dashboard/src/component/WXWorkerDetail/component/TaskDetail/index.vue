<template>
    <div class="task-detail">
        <div class="task-detail-header">
            <span>{{ TaskTypeDict[task.type] }}</span>
            <span>{{ TaskStatusDict[task.result?.status ?? TaskStatus.NOT_STARTED] }}</span>
            <span>{{ task.result?.message }}</span>
        </div>
        <div class="task-detail-content">
            <div class="running-report-list">
                <div class="running-report-item" v-for="report in task.runningReportList" :key="report.timestamp">
                    <span>{{ report.title }}</span>
                    <span>{{ report.description }}</span>
                    <img v-for="image in report.images || []" :key="image" :src="image" alt="image"
                        style="width: 100px; height: 100px;" />
                    <span>{{ dayjs(report.timestamp).format('YYYY-MM-DD HH:mm:ss') }}</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { BaseTaskInfo } from 'mp-assistant-common/dist/work/task/type';
import dayjs from 'dayjs';
import { TaskStatus, TaskStatusDict, TaskTypeDict } from 'mp-assistant-common/dist/work/task/index';

const props = defineProps<{
    task: BaseTaskInfo;
}>();
</script>

<style scoped lang="scss">
@import "./index.scss";
</style>