<template>
    <el-drawer class="task-detail-drawer-panel" :model-value="drawerOpen" direction="rtl" size="min(440px, 92vw)"
        append-to-body @update:model-value="onDrawerVisibleChange">
        <template #header="{ titleId, titleClass }">
            <span v-if="task" :id="titleId" :class="[titleClass, 'task-detail-drawer-header-title']">
                <img v-if="task.type === TaskType.WX_INSPECT_VERSION" src="@/assets/check-the-version.png" alt=""
                    class="task-detail-drawer-header-icon">
                <img v-else-if="task.type === TaskType.WX_AUDIT" src="@/assets/review.png" alt=""
                    class="task-detail-drawer-header-icon">
                <img v-else-if="task.type === TaskType.WX_PUBLISH" src="@/assets/release.png" alt=""
                    class="task-detail-drawer-header-icon">
                <span class="task-detail-drawer-header-text">{{ drawerTitle }}</span>
            </span>
            <span v-else :id="titleId" :class="titleClass">任务详情</span>
        </template>
        <template v-if="task">
            <el-scrollbar class="task-detail-scrollbar">
                <div class="task-detail">
                    <div v-if="wxaItem" class="detail-section detail-section--wxa">
                        <div class="section-title">小程序</div>
                        <WXAItem :wxa-item="wxaItem" />
                    </div>
                    <div class="detail-section status-section" :class="{
                        running: task.status === TaskStatus.RUNNING,
                        completed: task.status === TaskStatus.COMPLETED,
                        failed: task.status === TaskStatus.FAILED,
                        'not-started': task.status === TaskStatus.NOT_STARTED,
                    }">
                        <div class="status-main">
                            <div class="status-badge">
                                <div class="dot"></div>
                                <span>{{ TaskStatusDict[task.status] }}</span>
                            </div>
                            <span v-if="task.status === TaskStatus.COMPLETED
                                || task.status === TaskStatus.FAILED" class="status-time">
                                结束时间：{{ dayjs(task.endTime).format('YYYY-MM-DD HH:mm:ss') }}
                            </span>
                        </div>
                        <div v-if="task.result?.msg" class="status-msg">
                            {{ task.result.msg }}
                        </div>
                    </div>

                    <div v-if="WXTaskN.isAuditInfo(task) || WXTaskN.isPublishInfo(task)" class="detail-section">
                        <div class="section-title">任务参数</div>
                        <div class="section-body">
                            <div v-if="(task.options.positioner || []).length > 0" class="param-row">
                                <div class="param-label">版本定位</div>
                                <div class="positioner-chips">
                                    <div v-for="(item, index) in task.options.positioner" :key="index"
                                        class="positioner-chip">
                                        <span class="chip-type">{{ VersionPositioningTypeDict[item.type] }}</span>
                                        <span class="chip-criteria">{{ VersionPositioningCriteriaDict[item.criteria]
                                        }}</span>
                                        <span class="chip-value">{{ item.value }}</span>
                                    </div>
                                </div>
                            </div>
                            <template v-if="WXTaskN.isAuditInfo(task)">
                                <div v-if="task.options.populateData?.versionDescription" class="param-row">
                                    <div class="param-label">版本描述</div>
                                    <div class="param-text">{{ task.options.populateData.versionDescription }}
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
                            <el-timeline v-if="task.runningReportList.length > 0" class="report-timeline">
                                <el-timeline-item v-for="(taskReport, index) in task.runningReportList" :key="index"
                                    :timestamp="dayjs(taskReport.timestamp).format('YYYY-MM-DD HH:mm:ss')"
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
        </template>
    </el-drawer>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { dayjs } from 'element-plus';
import { TaskStatus, TaskStatusDict, TaskType, TaskTypeDict, WXTaskN, type BaseTaskInfo } from '@mp-assistant/common/dist/work/task';
import { VersionPositioningCriteriaDict, VersionPositioningTypeDict } from '@mp-assistant/common/dist/utils/wx';
import { getFileUrl } from '@/api';
import type { WXMPItem } from '@mp-assistant/common/dist/types/wx';
import WXAItem from '@/component/WXAItem/index.vue';

const props = defineProps<{
    task: BaseTaskInfo | null;
    wxaItem: WXMPItem | null;
}>();

const emit = defineEmits<{
    (e: 'close'): void;
}>();

const drawerOpen = computed(() => !!props.task);

const drawerTitle = computed(() => {
    const t = props.task;
    if (!t) return '任务详情';
    return `任务详情 · ${TaskTypeDict[t.type]}`;
});

const previewImages = computed(() => {
    if (props.task && WXTaskN.isAuditInfo(props.task)) {
        return props.task.options.populateData?.imagePreview?.split(',')?.filter(Boolean) || [];
    }
    return [];
});

const previewVideos = computed(() => {
    if (props.task && WXTaskN.isAuditInfo(props.task)) {
        return props.task.options.populateData?.videoPreview?.split(',')?.filter(Boolean) || [];
    }
    return [];
});

const onDrawerVisibleChange = (open: boolean) => {
    if (!open) {
        emit('close');
    }
};
</script>

<style lang="scss">
@use "./index.scss";
</style>
