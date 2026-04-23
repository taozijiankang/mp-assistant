<template>
    <div class="task-stack">
        <div class="task-list">
            <div class="controller">
                <el-input v-model="filterKeyword" placeholder="请输入过滤关键词 多个关键词用空格分隔" clearable />
                <el-button type="primary" @click="handleAddTask?.()">添加任务</el-button>
                <div class="worker-status-icon-container" @click="handleChangeWorkerStatus">
                    <img v-if="props.workerDetail.status === WorkerStatus.PAUSED" src="@/assets/pause.png"
                        alt="worker-status-icon" class="worker-status-icon">
                    <img v-if="props.workerDetail.status === WorkerStatus.RUNNING" src="@/assets/play.png"
                        alt="worker-status-icon" class="worker-status-icon">
                </div>
            </div>
            <div class="filter">
                <div v-for="item in filterStatusOptions" :key="item.value" class="filter-chip"
                    :class="[`chip-${item.colorKey}`, { 'selected': item.value === filterStatus }]"
                    @click="filterStatus = item.value">
                    <div class="dot"></div>
                    <span class="label">{{ item.label }}</span>
                    <span class="count">{{taskList.filter(task => item.value === 'all' || task.status ===
                        item.value).length}}</span>
                </div>
            </div>
            <el-scrollbar v-if="displayTaskList.length > 0" class="task-list-content-scrollbar">
                <div class="task-scroll-panel">
                    <div class="task-list-content">
                        <!-- 按创建时间降序（新在上），仅状态随执行变化 -->
                        <div v-for="taskItem in displayTaskList" :key="taskItem.key" class="task-item-row"
                            @click="handleTaskClick(taskItem)">
                            <span
                                v-if="taskItem.status === TaskStatus.RUNNING || taskItem.status === TaskStatus.NOT_STARTED"
                                class="task-item-status-dot" :class="{
                                    'task-item-status-dot--running': taskItem.status === TaskStatus.RUNNING,
                                    'task-item-status-dot--not-started': taskItem.status === TaskStatus.NOT_STARTED,
                                }" role="status" :aria-label="TaskStatusDict[taskItem.status]"></span>
                            <div class="task-item" :class="[
                                `task-item--type-${taskItemTypeClass(taskItem.type)}`,
                                {
                                    selected: taskItem.key === selectedTaskKey,
                                    'not-started': taskItem.status === TaskStatus.NOT_STARTED,
                                    running: taskItem.status === TaskStatus.RUNNING,
                                    completed: taskItem.status === TaskStatus.COMPLETED,
                                    failed: taskItem.status === TaskStatus.FAILED,
                                },
                            ]">
                            <div class="task-item-header">
                                <div class="task-type" :class="`task-type--${taskItemTypeClass(taskItem.type)}`">
                                    <img v-if="taskItem.type === TaskType.WX_INSPECT_VERSION"
                                        src="@/assets/check-the-version.png" alt="" class="task-type-icon">
                                    <img v-if="taskItem.type === TaskType.WX_AUDIT" src="@/assets/review.png"
                                        alt="" class="task-type-icon">
                                    <img v-if="taskItem.type === TaskType.WX_PUBLISH" src="@/assets/release.png"
                                        alt="" class="task-type-icon">
                                    <span class="task-type-name">{{ TaskTypeDict[taskItem.type] }}</span>
                                </div>
                                <div class="task-status-chip">
                                    <div class="dot"></div>
                                    <span>{{ TaskStatusDict[taskItem.status] }}</span>
                                </div>
                            </div>
                            <WXAItem v-if="getWxaInfo(taskItem.options)" class="task-wxa-item"
                                :wxa-item="getWxaInfo(taskItem.options)!" />
                            <div v-if="taskItem.status === TaskStatus.FAILED && taskItem.result?.msg" class="fail-msg">
                                <el-icon class="fail-icon">
                                    <WarningFilled />
                                </el-icon>
                                <span>{{ taskItem.result?.msg }}</span>
                            </div>
                            <div v-if="WXTaskN.isPublishInfo(taskItem) && taskItem.publishQRCodeFilePath && taskItem.status === TaskStatus.RUNNING"
                                class="publish-qrcode-container">
                                <div class="publish-qrcode-header">
                                    <el-icon class="loading-icon">
                                        <Loading />
                                    </el-icon>
                                    <span class="publish-qrcode-description">需要扫描二维码进行发布 剩余 {{
                                        Math.round(taskItem.countdown) }}s</span>
                                </div>
                                <img :src="getFileUrl(taskItem.publishQRCodeFilePath)" alt="publish-qrcode"
                                    class="publish-qrcode-image" />
                            </div>
                            <div v-if="taskItem.status !== TaskStatus.RUNNING" class="task-item-footer">
                                <el-button v-if="taskItem.status === TaskStatus.FAILED" class="retry-btn" text
                                    type="primary" size="small" :loading="retryTaskLoadings.includes(taskItem.key)"
                                    @click.stop="handleRetryFailedTask(taskItem)">
                                    <el-icon>
                                        <RefreshRight />
                                    </el-icon>
                                    <span>重新添加</span>
                                </el-button>
                                <el-button class="delete-btn" text size="small"
                                    :loading="removeTaskLoadings.includes(taskItem.key)"
                                    @click.stop="handleDestroyTask(taskItem)">
                                    <el-icon>
                                        <Delete />
                                    </el-icon>
                                    <span>删除</span>
                                </el-button>
                            </div>
                            </div>
                        </div>
                    </div>
                </div>
            </el-scrollbar>
            <div v-else class="no-data">
                <el-empty description="暂无数据" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { TaskStatus, TaskStatusDict, TaskType, TaskTypeDict, WXTaskN, type BaseTaskInfo } from '@mp-assistant/common/dist/work/task';
import { ref, computed, inject } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { WorkerStatus, WXWorkerN } from '@mp-assistant/common/dist/work';
import { Delete, WarningFilled, Loading, RefreshRight } from '@element-plus/icons-vue';
import { getFileUrl, requestAddTask, requestPauseAndRecoverWorker, requestRemoveTask } from '@/api';
import type { AddTaskFormData } from '../../../../../../component/AddTaskDialog/index';
import fuzzysort from 'fuzzysort';
import WXAItem from '@/component/WXAItem/index.vue';

const props = defineProps<{
    workerDetail: WXWorkerN.WXWorkInfo;
    selectedTaskKey: string;
}>();

const emit = defineEmits<{
    (e: 'update:selectedTaskKey', key: string): void;
}>();

const handleAddTask = inject<(formData?: AddTaskFormData, presetAppIds?: string[]) => void>('handleAddTask');

const removeTaskLoadings = ref<string[]>([]);
const retryTaskLoadings = ref<string[]>([]);

const filterKeyword = ref('');
const filterStatus = ref<TaskStatus | 'all'>('all');

const filterStatusOptions = computed<{
    label: string;
    value: TaskStatus | 'all';
    colorKey: string;
}[]>(() => {
    return [
        { label: '全部', value: 'all', colorKey: 'all' },
        { label: '未开始', value: TaskStatus.NOT_STARTED, colorKey: 'not-started' },
        { label: '执行中', value: TaskStatus.RUNNING, colorKey: 'running' },
        { label: '完成', value: TaskStatus.COMPLETED, colorKey: 'completed' },
        { label: '失败', value: TaskStatus.FAILED, colorKey: 'failed' },
    ];
});

const taskList = computed(() => {
    return [...props.workerDetail.taskList].sort(
        (a, b) => b.createTime - a.createTime || a.key.localeCompare(b.key),
    );
});

const filteredTaskList = computed(() => {
    let list = taskList.value;
    if (filterStatus.value !== 'all') {
        list = list.filter(task => task.status === filterStatus.value);
    }
    if (filterKeyword.value) {
        const fuzzysortKeys: {
            key: (item: BaseTaskInfo) => string;
            weight: number;
        }[] = [
                {
                    // 任务类型
                    key: item => TaskTypeDict[item.type],
                    weight: 3,
                },
                {
                    // 任务状态
                    key: item => TaskStatusDict[item.status],
                    weight: 2,
                },
                {
                    // 任务关键字
                    key: item => item.key,
                    weight: 1,
                },
                {
                    // 小程序名称
                    key: item => getWxaInfo(item.options)?.app_name || '',
                    weight: 2,
                },
                {
                    // appid
                    key: item => getWxaInfo(item.options)?.appid || '',
                    weight: 2,
                },
                {
                    // username
                    key: item => getWxaInfo(item.options)?.username || '',
                    weight: 2,
                },
            ];
        list = fuzzysort.go(filterKeyword.value, list, {
            keys: fuzzysortKeys.map(item => item.key),
            scoreFn: item => {
                return fuzzysortKeys.reduce((a, b, i) => {
                    return a + item[i].score * b.weight;
                }, 0);
            },
        }).map(item => item.obj);
    }
    // 关键词匹配后仍按创建时间降序（新在上）；同时间戳用 key 保证顺序稳定
    return [...list].sort((a, b) => b.createTime - a.createTime || a.key.localeCompare(b.key));
});

/** 展示顺序：新任务在上、旧在下，仅状态变化不改变相对位置 */
const displayTaskList = computed(() => filteredTaskList.value);

/** 列表卡片样式用：检查版本 / 审核 / 发布 */
function taskItemTypeClass(type: TaskType): 'inspect' | 'audit' | 'publish' {
    if (type === TaskType.WX_INSPECT_VERSION) return 'inspect';
    if (type === TaskType.WX_AUDIT) return 'audit';
    if (type === TaskType.WX_PUBLISH) return 'publish';
    return 'inspect';
}

const handleTaskClick = (taskItem: BaseTaskInfo) => {
    emit('update:selectedTaskKey', taskItem.key);
}

function cloneTaskOptions<T extends any>(opts: T): T {
    return JSON.parse(JSON.stringify(opts)) as T;
}

const handleRetryFailedTask = async (taskItem: BaseTaskInfo) => {
    if (!WXTaskN.isWXTaskInfo(taskItem) || !taskItem.options?.appid) {
        ElMessage.warning('无法读取任务参数');
        return;
    }
    if (retryTaskLoadings.value.includes(taskItem.key)) {
        return;
    }
    retryTaskLoadings.value.push(taskItem.key);
    const workerKey = props.workerDetail.key;
    try {
        const options = cloneTaskOptions(taskItem.options);
        await requestAddTask(workerKey, {
            type: taskItem.type,
            options,
        });
        if (
            taskItem.type === TaskType.WX_AUDIT ||
            taskItem.type === TaskType.WX_PUBLISH
        ) {
            await requestAddTask(workerKey, {
                type: TaskType.WX_INSPECT_VERSION,
                options: { appid: taskItem.options.appid },
            });
        }
        ElMessage.success('已重新添加任务');
    } catch (e) {
        console.error(e);
        ElMessage.error('重新添加失败');
    } finally {
        retryTaskLoadings.value = retryTaskLoadings.value.filter(k => k !== taskItem.key);
    }
};

const getWxaInfo = (options: WXTaskN.TaskOptions) => {
    return props.workerDetail.wxaList.find(wxa => wxa.appid === options.appid);
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

const handleChangeWorkerStatus = async () => {
    const { message } = await requestPauseAndRecoverWorker(props.workerDetail.key);
    ElMessage.success(message || '');
}

</script>

<style scoped lang="scss">
@use "./index.scss";
</style>
