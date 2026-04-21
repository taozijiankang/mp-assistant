<template>
    <div class="version-list">
        <template v-for="versionListInfo in showVersionList" :key="versionListInfo.type">
            <div class="section-title" :class="sectionColorClass(versionListInfo.type)">
                <span class="bar"></span>
                <span class="text">{{ versionListInfo.title }}</span>
                <span class="count">{{ versionListInfo.versions.length }}</span>
            </div>
            <div class="version-card-list">
                <div v-for="(item, idx) in versionListInfo.versions" :key="`${versionListInfo.type}-${idx}`"
                    class="version-card" :class="cardAccentClass(versionListInfo.type, item)">
                    <!-- 卡片头：版本号 + 徽章 + 操作按钮 -->
                    <div class="card-header">
                        <span class="version-no">{{ item.version || '—' }}</span>
                        <el-tag v-if="item.is_exper" size="small" type="info" effect="light">体验版</el-tag>
                        <el-tag v-if="versionListInfo.type === WXTaskN.VersionType.TEST && item.audit_status"
                            size="small" :type="auditTagType(item.audit_status)" effect="light">
                            {{ WXReviewStatusDict[item.audit_status as WXReviewStatus] }}
                        </el-tag>
                        <el-tag v-if="versionListInfo.type === WXTaskN.VersionType.DEVELOP && isSameAsOnline(item)"
                            size="small" type="primary" effect="dark">已上线</el-tag>
                        <div class="header-actions">
                            <el-button v-if="versionListInfo.type === WXTaskN.VersionType.DEVELOP" size="small" plain
                                @click="handleSubmitAudit(item)">提审</el-button>
                            <el-tooltip v-else-if="versionListInfo.type === WXTaskN.VersionType.TEST"
                                :disabled="item.audit_status === WXReviewStatus.SUCCESS" content="审核通过后才能发布"
                                placement="top">
                                <span class="publish-button-wrap">
                                    <el-button size="small" plain
                                        :disabled="item.audit_status !== WXReviewStatus.SUCCESS"
                                        @click="handleSubmitPublish(item)">发布</el-button>
                                </span>
                            </el-tooltip>
                        </div>
                    </div>

                    <!-- 时间单独一行 -->
                    <div v-if="item.time" class="card-time">{{ formatTime(item.time) }}</div>

                    <!-- meta：发布者 + 备注信息（每行一个） -->
                    <div class="card-meta">
                        <div v-if="item.nick_name" class="meta-item">
                            发布者 <span class="meta-value">{{ item.nick_name }}</span>
                            <el-icon class="copy-icon" @click="handleCopy(item.nick_name)">
                                <CopyDocument />
                            </el-icon>
                        </div>
                        <template v-if="metaSegments(item.describe)">
                            <div v-for="(seg, i) in metaSegments(item.describe)" :key="i" class="meta-item">
                                <span class="meta-value">{{ seg }}</span>
                                <el-icon class="copy-icon" @click="handleCopy(seg)">
                                    <CopyDocument />
                                </el-icon>
                            </div>
                        </template>
                        <div v-else-if="item.describe" class="meta-item">
                            <span class="meta-label">备注</span>
                            <span>{{ item.describe }}</span>
                        </div>
                    </div>

                    <!-- 审核失败原因 -->
                    <div v-if="versionListInfo.type === WXTaskN.VersionType.TEST
                        && item.audit_status === WXReviewStatus.FAIL
                        && (item.fail_reason || item.reject_reason)" class="fail-reason">
                        <div v-if="item.fail_reason" class="reason-block">
                            <span class="reason-label">失败原因</span>
                            <div class="reason-content">{{ normalizeReason(item.fail_reason) }}</div>
                        </div>
                        <div v-if="item.reject_reason" class="reason-block">
                            <span class="reason-label">驳回理由</span>
                            <div class="reason-content">{{ normalizeReason(item.reject_reason) }}</div>
                        </div>
                    </div>

                </div>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { WXReviewStatusDict } from '@mp-assistant/common/dist/constant';
import { WXReviewStatus, type VersionListItem } from '@mp-assistant/common/dist/types/wx';
import { TaskType, WXTaskN, type BaseTaskInfo } from '@mp-assistant/common/dist/work/task';
import { computed, inject } from 'vue';
import type { AddTaskFormData } from '../../../../../../../../component/AddTaskDialog/index';
import type { WXMPItem } from '@mp-assistant/common/dist/types/wx';
import { VersionPositioningCriteria, VersionPositioningType } from '@mp-assistant/common/dist/utils/wx';
import { dayjs, ElMessage } from 'element-plus';
import { CopyDocument } from '@element-plus/icons-vue';

const props = defineProps<{
    wxmpItem: WXMPItem;
    relatedTask: BaseTaskInfo[];
    inspectVersionTaskInfo: WXTaskN.InspectVersionInfo,
}>();

const handleAddTask = inject<(formData?: AddTaskFormData) => void>('handleAddTask');

const versionList = computed(() => {
    return props.inspectVersionTaskInfo.result?.data as WXTaskN.VersionListData | undefined
});

const onlineVersion = computed(() => versionList.value?.[WXTaskN.VersionType.ONLINE]);
const testVersion = computed(() => versionList.value?.[WXTaskN.VersionType.TEST]);
const devVersions = computed(() => versionList.value?.[WXTaskN.VersionType.DEVELOP] || []);

const showVersionList = computed(() => {
    return [
        {
            title: '线上版本',
            type: WXTaskN.VersionType.ONLINE,
            versions: [onlineVersion.value].filter(Boolean) as VersionListItem[],
        },
        {
            title: '审核版本',
            type: WXTaskN.VersionType.TEST,
            versions: ([testVersion.value].filter(Boolean) as VersionListItem[]).filter(el => el.audit_status),
        },
        {
            title: '开发版本',
            type: WXTaskN.VersionType.DEVELOP,
            versions: devVersions.value as VersionListItem[],
        }
    ].filter(item => item.versions.length > 0);
});

const sectionColorClass = (type: WXTaskN.VersionType) => ({
    online: type === WXTaskN.VersionType.ONLINE,
    test: type === WXTaskN.VersionType.TEST,
    dev: type === WXTaskN.VersionType.DEVELOP,
});

const cardAccentClass = (type: WXTaskN.VersionType, item: VersionListItem) => {
    if (type === WXTaskN.VersionType.TEST) {
        return {
            'accent-success': item.audit_status === WXReviewStatus.SUCCESS,
            'accent-warning': item.audit_status === WXReviewStatus.REVIEWING,
            'accent-danger': item.audit_status === WXReviewStatus.FAIL,
        };
    }
    return {
        'accent-primary': type === WXTaskN.VersionType.ONLINE,
        'accent-success': type === WXTaskN.VersionType.DEVELOP,
    };
};

const isSameAsOnline = (item: VersionListItem) => {
    const online = onlineVersion.value;
    if (!online) return false;
    return item.version === online.version
        && item.nick_name === online.nick_name
        && item.describe === online.describe;
};

const auditTagType = (status: number | undefined) => {
    if (status === WXReviewStatus.SUCCESS) return 'success';
    if (status === WXReviewStatus.REVIEWING) return 'warning';
    if (status === WXReviewStatus.FAIL) return 'danger';
    return 'info';
};

const metaSegments = (describe?: string): string[] | undefined => {
    if (!describe) return undefined;
    const trimmed = describe.trim();
    if (!/^(\s*\[[^\]]+\]\s*)+$/.test(trimmed)) return undefined;
    return trimmed.match(/\[[^\]]+\]/g) ?? undefined;
};

const normalizeReason = (html?: string) => {
    if (!html) return '';
    return html.replace(/<br\s*\/?>/gi, '\n');
};

const formatTime = (time: number) => {
    // 微信接口通常返回秒级时间戳，兼容毫秒
    const ms = time > 1e12 ? time : time * 1000;
    return dayjs(ms).format('YYYY-MM-DD HH:mm');
};

const handleCopy = async (text: string) => {
    try {
        await navigator.clipboard.writeText(text);
        ElMessage.success('已复制');
    } catch {
        ElMessage.error('复制失败');
    }
};

const buildPositioner = (item: VersionListItem) => [
    { type: VersionPositioningType.Version, criteria: VersionPositioningCriteria.Equal, value: item.version || '' },
    { type: VersionPositioningType.NickName, criteria: VersionPositioningCriteria.Equal, value: item.nick_name || '' },
    { type: VersionPositioningType.Describe, criteria: VersionPositioningCriteria.Equal, value: item.describe || '' },
];

const handleSubmitAudit = (item: VersionListItem) => {
    const nearestAuditTaskOptions = props.relatedTask.find(task => task.type === TaskType.WX_AUDIT)?.options as WXTaskN.AuditTaskOptions | undefined;
    handleAddTask?.({
        appIds: [props.wxmpItem.appid],
        type: TaskType.WX_AUDIT,
        positioner: buildPositioner(item),
        populateData: {
            versionDescription: nearestAuditTaskOptions?.populateData?.versionDescription || '',
            imagePreview: (nearestAuditTaskOptions?.populateData?.imagePreview?.split(',') || []).filter(Boolean),
            videoPreview: (nearestAuditTaskOptions?.populateData?.videoPreview?.split(',') || []).filter(Boolean),
        }
    });
};

const handleSubmitPublish = (item: VersionListItem) => {
    handleAddTask?.({
        appIds: [props.wxmpItem.appid],
        type: TaskType.WX_PUBLISH,
        positioner: buildPositioner(item),
    });
};
</script>

<style scoped lang="scss">
@use "./index.scss";
</style>
