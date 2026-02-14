<template>
    <el-table :data="taskList">
        <el-table-column type="expand">
            <template #default="{ row }: { row: BaseTaskInfo }">
                <TaskDetail :task="row" />
            </template>
        </el-table-column>
        <el-table-column label="任务类型">
            <template #default="{ row }: { row: BaseTaskInfo }">
                <span>{{ TaskTypeDict[row.type] }}</span>
            </template>
        </el-table-column>
        <el-table-column label="任务状态">
            <template #default="{ row }: { row: BaseTaskInfo }">
                <el-tag v-if="row.status === TaskStatus.NOT_STARTED" type="info">{{
                    TaskStatusDict[TaskStatus.NOT_STARTED] }}</el-tag>
                <el-tag v-else-if="row.status === TaskStatus.RUNNING" type="warning">{{
                    TaskStatusDict[TaskStatus.RUNNING] }}</el-tag>
                <el-tag v-else-if="row.status === TaskStatus.WAITING_RESULT" type="warning">{{
                    TaskStatusDict[TaskStatus.WAITING_RESULT] }}</el-tag>
                <el-tag v-else-if="row.status === TaskStatus.COMPLETED" type="success">{{
                    TaskStatusDict[TaskStatus.COMPLETED] }}</el-tag>
                <el-tag v-else-if="row.status === TaskStatus.FAILED" type="danger">{{ TaskStatusDict[TaskStatus.FAILED]
                }}</el-tag>
                <span v-else>{{ TaskStatusDict[row.status] }}</span>
            </template>
        </el-table-column>
    </el-table>
</template>

<script setup lang="ts">
import type { BaseTaskInfo } from 'mp-assistant-common/dist/work/task/type';
import { TaskTypeDict, TaskStatusDict, TaskStatus } from 'mp-assistant-common/dist/work/task/index';
import TaskDetail from '../TaskDetail/index.vue';

defineProps<{
    taskList: BaseTaskInfo[];
}>();
</script>