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
                        <div class="task-item-header">
                            <div class="task-type">
                                <img v-if="taskItem.type === TaskType.WX_INSPECT_VERSION"
                                    src="@/assets/check-the-version.png" alt="task-type-icon" class="task-type-icon">
                                <img v-if="taskItem.type === TaskType.WX_AUDIT" src="@/assets/review.png"
                                    alt="task-type-icon" class="task-type-icon">
                                <img v-if="taskItem.type === TaskType.WX_PUBLISH" src="@/assets/release.png"
                                    alt="task-type-icon" class="task-type-icon">
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
            </el-scrollbar>
            <div v-else class="no-data">
                <el-empty description="暂无数据" />
            </div>
        </div>
        <el-scrollbar v-if="onSelectedTask" class="task-detail-scrollbar">
            <div class="task-detail">
                <div class="detail-section status-section" :class="{
                    running: onSelectedTask.status === TaskStatus.RUNNING,
                    completed: onSelectedTask.status === TaskStatus.COMPLETED,
                    failed: onSelectedTask.status === TaskStatus.FAILED,
                    'not-started': onSelectedTask.status === TaskStatus.NOT_STARTED,
                }">
                    <div class="status-main">
                        <div class="status-badge">
                            <div class="dot"></div>
                            <span>{{ TaskStatusDict[onSelectedTask.status] }}</span>
                        </div>
                        <span v-if="onSelectedTask.status === TaskStatus.COMPLETED
                            || onSelectedTask.status === TaskStatus.FAILED" class="status-time">
                            结束时间：{{ dayjs(onSelectedTask.endTime).format('YYYY-MM-DD HH:mm:ss') }}
                        </span>
                    </div>
                    <div v-if="onSelectedTask.result?.msg" class="status-msg">
                        {{ onSelectedTask.result.msg }}
                    </div>
                </div>

                <div v-if="WXTaskN.isAuditInfo(onSelectedTask) || WXTaskN.isPublishInfo(onSelectedTask)"
                    class="detail-section">
                    <div class="section-title">任务参数</div>
                    <div class="section-body">
                        <div v-if="(onSelectedTask.options.positioner || []).length > 0" class="param-row">
                            <div class="param-label">版本定位</div>
                            <div class="positioner-chips">
                                <div v-for="(item, index) in onSelectedTask.options.positioner" :key="index"
                                    class="positioner-chip">
                                    <span class="chip-type">{{ VersionPositioningTypeDict[item.type] }}</span>
                                    <span class="chip-criteria">{{ VersionPositioningCriteriaDict[item.criteria]
                                        }}</span>
                                    <span class="chip-value">{{ item.value }}</span>
                                </div>
                            </div>
                        </div>
                        <template v-if="WXTaskN.isAuditInfo(onSelectedTask)">
                            <div v-if="onSelectedTask.options.populateData?.versionDescription" class="param-row">
                                <div class="param-label">版本描述</div>
                                <div class="param-text">{{ onSelectedTask.options.populateData.versionDescription }}
                                </div>
                            </div>
                            <div v-if="previewImages.length > 0" class="param-row">
                                <div class="param-label">图片预览</div>
                                <div class="media-grid">
                                    <el-image v-for="(image, index) in previewImages" :key="image"
                                        :src="getFileUrl(image)" fit="cover"
                                        :preview-src-list="previewImages.map(i => getFileUrl(i))" preview-teleported
                                        :initial-index="index" />
                                </div>
                            </div>
                            <div v-if="previewVideos.length > 0" class="param-row">
                                <div class="param-label">视频预览</div>
                                <div class="media-grid media-grid-video">
                                    <video v-for="video in previewVideos" :key="video" :src="getFileUrl(video)"
                                        controls />
                                </div>
                            </div>
                        </template>
                    </div>
                </div>

                <div class="detail-section">
                    <div class="section-title">运行报告</div>
                    <div class="section-body">
                        <el-timeline v-if="onSelectedTask.runningReportList.length > 0" class="report-timeline">
                            <el-timeline-item v-for="(taskReport, index) in onSelectedTask.runningReportList"
                                :key="index" :timestamp="dayjs(taskReport.timestamp).format('YYYY-MM-DD HH:mm:ss')"
                                placement="top">
                                <div class="report-item">
                                    <span class="report-item-title">{{ taskReport.title }}</span>
                                    <span v-if="taskReport.description" class="report-item-description">
                                        {{ taskReport.description }}
                                    </span>
                                    <div v-if="taskReport.images && taskReport.images.length > 0"
                                        class="report-item-images">
                                        <el-image
                                            v-for="(image, index) in taskReport.images.map(image => getFileUrl(image))"
                                            :key="image" :src="image" fit="contain"
                                            :preview-src-list="taskReport.images.map(image => getFileUrl(image))"
                                            preview-teleported :initial-index="index" />
                                    </div>
                                </div>
                            </el-timeline-item>
                        </el-timeline>
                        <el-empty v-else description="暂无任务运行报告" :image-size="60" />
                    </div>
                </div>
            </div>
        </el-scrollbar>
        <el-empty v-else class="no-task-data" description="暂无任务数据" />
    </div>
</template>

<script setup lang="ts">
import { TaskStatus, TaskStatusDict, TaskType, TaskTypeDict, WXTaskN, type BaseTaskInfo } from '@mp-assistant/common/dist/work/task';
import { ref, computed, inject } from 'vue';
import { dayjs, ElMessage, ElMessageBox } from 'element-plus';
import { WorkerStatus, WXWorkerN } from '@mp-assistant/common/dist/work';
import { useOperationRecordStore } from '@/stores';
import { storeToRefs } from 'pinia';
import { Delete, WarningFilled, Loading } from '@element-plus/icons-vue';
import { getFileUrl, requestPauseAndRecoverWorker, requestRemoveTask } from '@/api';
import type { AddTaskFormData } from '../../../../../../component/AddTaskDialog/index';
import fuzzysort from 'fuzzysort';
import { VersionPositioningCriteriaDict, VersionPositioningTypeDict } from '@mp-assistant/common/dist/utils/wx';
import WXAItem from '@/component/WXAItem/index.vue';

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

const onSelectedTask = computed(() => {
    return props.workerDetail.taskList.find(task => task.key === onSelectedTaskKey.value);
});

const taskList = computed(() => {
    return [...props.workerDetail.taskList].sort((a, b) => a.createTime - b.createTime);
});

const previewImages = computed(() => {
    if (onSelectedTask.value && WXTaskN.isAuditInfo(onSelectedTask.value)) {
        return onSelectedTask.value.options.populateData?.imagePreview?.split(',')?.filter(Boolean) || [];
    }
    return [];
});

const previewVideos = computed(() => {
    if (onSelectedTask.value && WXTaskN.isAuditInfo(onSelectedTask.value)) {
        return onSelectedTask.value.options.populateData?.videoPreview?.split(',')?.filter(Boolean) || [];
    }
    return [];
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
    return list;
});

const handleTaskClick = (taskItem: BaseTaskInfo) => {
    operationRecordStore.setOnSelectedTaskKey(taskItem.key);
}

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
