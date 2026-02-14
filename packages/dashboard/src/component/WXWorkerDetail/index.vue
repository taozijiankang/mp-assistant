<template>
    <div class="worker-detail-container">
        <div class="panel">
            <div class="worker-detail-header">
                <span>{{ worker.name }}</span>
                <span>{{ worker.type }}</span>
            </div>
            <!-- 未登录需要扫码 -->
            <div class="login-qrcode" v-if="!worker.isLogin">
                <el-button type="primary" @click="handleLoginWorker">登录</el-button>
                <img v-if="worker.loginQRCodeURL" :src="worker.loginQRCodeURL" alt="login-qrcode" />
            </div>
            <div v-else>
                <el-button type="primary" @click="handleGetWxaList">获取小程序列表</el-button>
            </div>
            <el-tabs v-model="activeTab">
                <el-tab-pane :label="TabLabelDict[ActiveTab.WxaList]" :name="ActiveTab.WxaList">
                    <div class="wxa-list-control">
                        <el-button type="primary" @click="handleAddTask">添加任务</el-button>
                    </div>
                    <!-- 小程序列表 -->
                    <el-table :data="wxaList" style="width: 100%" @selection-change="handleWxaSelectionChange">
                        <el-table-column type="selection" width="55" />
                        <el-table-column label="小程序头像" width="100">
                            <template #default="{ row }: { row: WXMPItem }">
                                <img :src="row.app_headimg" alt="app-headimg" style="width: 50px; height: 50px;" />
                            </template>
                        </el-table-column>
                        <el-table-column label="小程序名称">
                            <template #default="{ row }: { row: WXMPItem }">
                                <span>{{ row.app_name }}</span>
                            </template>
                        </el-table-column>
                        <el-table-column label="小程序ID">
                            <template #default="{ row }: { row: WXMPItem }">
                                <span>{{ row.appid }}</span>
                            </template>
                        </el-table-column>
                        <el-table-column label="小程序原始ID">
                            <template #default="{ row }: { row: WXMPItem }">
                                <span>{{ row.username }}</span>
                            </template>
                        </el-table-column>
                    </el-table>
                </el-tab-pane>
                <el-tab-pane :label="TabLabelDict[ActiveTab.TaskList]" :name="ActiveTab.TaskList">
                    <!-- 任务列表 -->
                    <el-table :data="taskList" style="width: 100%">
                        <el-table-column label="任务类型">
                            <template #default="{ row }: { row: BaseTaskInfo }">
                                <span>{{ TaskTypeDict[row.type] }}</span>
                            </template>
                        </el-table-column>
                        <el-table-column label="任务状态">
                            <template #default="{ row }: { row: BaseTaskInfo }">
                                <span>{{ TaskStatusDict[row.status] }}</span>
                            </template>
                        </el-table-column>
                    </el-table>
                </el-tab-pane>
                <el-tab-pane :label="TabLabelDict[ActiveTab.CompletedTaskList]" :name="ActiveTab.CompletedTaskList">
                    <!-- 已完成任务 -->
                    <el-table :data="completedTaskList" style="width: 100%">
                        <el-table-column label="任务类型">
                            <template #default="{ row }: { row: BaseTaskInfo }">
                                <span>{{ TaskTypeDict[row.type] }}</span>
                            </template>
                        </el-table-column>
                        <el-table-column label="任务状态">
                            <template #default="{ row }: { row: BaseTaskInfo }">
                                <span>{{ TaskStatusDict[row.status] }}</span>
                            </template>
                        </el-table-column>
                        <el-table-column label="操作">
                            <template #default="{ row }: { row: BaseTaskInfo }">
                                <el-button type="primary" @click="handleViewTaskDetail(row)">查看</el-button>
                            </template>
                        </el-table-column>
                    </el-table>
                </el-tab-pane>
            </el-tabs>

        </div>
        <div class="current-running-task">
            <TaskDetail v-for="task in currentRunningTasks" :key="task.key" :task="task" />
        </div>
        <AddTaskDialog ref="addTaskDialogRef" />
        <TaskDetailDrawer ref="taskDetailDrawerRef" />
    </div>
</template>
<script setup lang="ts">
import type { WXWorkInfo } from 'mp-assistant-common/dist/work/type';
import { computed, ref } from 'vue';
import type { WXMPItem } from 'mp-assistant-common/dist/types/wx';
import type { BaseTaskInfo } from 'mp-assistant-common/dist/work/task/type';
import { TaskStatus, TaskStatusDict, TaskTypeDict } from 'mp-assistant-common/dist/work/task/index';
import TaskDetail from './component/TaskDetail/index.vue';
import { requestLoginWorker, requestWorkerGetWxaList } from '../../api/worker';
import AddTaskDialog from './component/AddTaskDialog/index.vue';
import TaskDetailDrawer from './component/TaskDetailDrawer/index.vue';

const props = defineProps<{
    worker: WXWorkInfo;
}>();

enum ActiveTab {
    WxaList = 'wxaList',
    TaskList = 'taskList',
    CompletedTaskList = 'completedTaskList',
}

const TabLabelDict = {
    [ActiveTab.WxaList]: '小程序列表',
    [ActiveTab.TaskList]: '任务列表',
    [ActiveTab.CompletedTaskList]: '已完成任务',
};

const activeTab = ref(ActiveTab.WxaList);

const addTaskDialogRef = ref<InstanceType<typeof AddTaskDialog>>();
const taskDetailDrawerRef = ref<InstanceType<typeof TaskDetailDrawer>>();
const wxaList = computed(() => {
    return props.worker.wxaList;
});

const selectedWxaAppIds = ref<string[]>([]);

const taskList = computed(() => {
    return props.worker.taskList;
});

const completedTaskList = computed(() => {
    return props.worker.completedTaskList;
});

const currentRunningTasks = computed(() => {
    return props.worker.taskList.filter(item => item.status === TaskStatus.RUNNING);
});

const handleLoginWorker = async () => {
    await requestLoginWorker(props.worker.key);
};

const handleGetWxaList = async () => {
    await requestWorkerGetWxaList(props.worker.key);
};

const handleAddTask = () => {
    addTaskDialogRef.value?.open(props.worker.key, wxaList.value.filter(item => selectedWxaAppIds.value.includes(item.appid)));
};

const handleWxaSelectionChange = (selection: WXMPItem[]) => {
    selectedWxaAppIds.value = selection.map(item => item.appid);
};

const handleViewTaskDetail = (task: BaseTaskInfo) => {
    taskDetailDrawerRef.value?.open(task);
};

</script>

<style scoped lang="scss">
@import "./index.scss";
</style>