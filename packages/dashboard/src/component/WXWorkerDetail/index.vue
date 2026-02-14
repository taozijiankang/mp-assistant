<template>
    <div class="worker-detail-container">
        <div class="worker-detail-header">
            <span>{{ worker.name || '未命名' }}</span>
            <span>{{ WorkerTypeDict[worker.type] }}</span>
            <!-- 未登录需要扫码 -->
            <div class="login-qrcode" v-if="!worker.isLogin">
                <el-button type="primary" @click="handleLoginWorker">登录</el-button>
                <img v-if="worker.loginQRCodeURL" :src="worker.loginQRCodeURL" alt="login-qrcode" />
            </div>
            <div v-else>
                <el-button type="primary" :loading="wxaListLoading" @click="handleGetWxaList">获取小程序列表</el-button>
            </div>
            <el-tabs v-model="activeTab">
                <el-tab-pane :label="TabLabelDict[ActiveTab.WxaList]" :name="ActiveTab.WxaList">
                </el-tab-pane>
                <el-tab-pane :label="TabLabelDict[ActiveTab.TaskList]" :name="ActiveTab.TaskList">
                </el-tab-pane>
                <el-tab-pane :label="TabLabelDict[ActiveTab.CompletedTaskList]" :name="ActiveTab.CompletedTaskList">
                </el-tab-pane>
            </el-tabs>
        </div>

        <div class="wxa-list-container" v-if="activeTab === ActiveTab.WxaList">
            <div class="wxa-list-control">
                <div class="wxa-list-control-search">
                    <el-input v-model="searchWxaName" placeholder="搜索小程序名称" />
                </div>
                <el-button type="primary" @click="handleAddTask">添加任务</el-button>
            </div>
            <!-- 小程序列表 -->
            <el-table class="wxa-list-table" :data="filteredWxaList" @selection-change="handleWxaSelectionChange">
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
        </div>

        <TaskList class="task-list-container" v-if="activeTab === ActiveTab.TaskList" :taskList="taskList" />

        <TaskList class="task-list-container" v-if="activeTab === ActiveTab.CompletedTaskList"
            :taskList="completedTaskList" />

        <AddTaskDialog ref="addTaskDialogRef" />
    </div>
</template>
<script setup lang="ts">
import type { WXWorkInfo } from 'mp-assistant-common/dist/work/type';
import { computed, ref } from 'vue';
import type { WXMPItem } from 'mp-assistant-common/dist/types/wx';
import { requestLoginWorker, requestWorkerGetWxaList } from '../../api/worker';
import AddTaskDialog from './component/AddTaskDialog/index.vue';
import TaskList from './component/TaskList/index.vue';
import { WorkerTypeDict } from 'mp-assistant-common/dist/work/index.js';

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
const searchWxaName = ref('');
const wxaListLoading = ref(false);

const addTaskDialogRef = ref<InstanceType<typeof AddTaskDialog>>();

const wxaList = computed(() => {
    return props.worker.wxaList;
});

const filteredWxaList = computed(() => {
    return wxaList.value.filter(item => item.app_name.includes(searchWxaName.value));
});

const selectedWxaAppIds = ref<string[]>([]);

const taskList = computed(() => {
    return props.worker.taskList;
});

const completedTaskList = computed(() => {
    return props.worker.completedTaskList;
});

const handleLoginWorker = async () => {
    await requestLoginWorker(props.worker.key);
};

const handleGetWxaList = async () => {
    wxaListLoading.value = true;
    try {
        await requestWorkerGetWxaList(props.worker.key);
    } catch (error) {
        console.error(error);
    } finally {
        wxaListLoading.value = false;
    }
};

const handleAddTask = () => {
    addTaskDialogRef.value?.open(props.worker.key, wxaList.value.filter(item => selectedWxaAppIds.value.includes(item.appid)));
};

const handleWxaSelectionChange = (selection: WXMPItem[]) => {
    selectedWxaAppIds.value = selection.map(item => item.appid);
};

</script>

<style scoped lang="scss">
@use "./index.scss";
</style>