<template>
    <div class="version-card" :class="cardAccentClass">
        <div class="card-header">
            <span class="version-no">{{ item.version || '—' }}</span>
            <el-tag v-if="item.is_exper" size="small" type="info" effect="light">体验版</el-tag>
            <el-tag v-if="versionType === WXTaskN.VersionType.TEST && item.audit_status" size="small"
                :type="auditTagType(item.audit_status)" effect="light">
                {{ WXReviewStatusDict[item.audit_status as WXReviewStatus] }}
            </el-tag>
            <el-tag v-if="versionType === WXTaskN.VersionType.DEVELOP && isSameAsOnline" size="small" type="primary"
                effect="dark">已上线</el-tag>
            <div class="header-actions">
                <el-button v-if="versionType === WXTaskN.VersionType.DEVELOP" size="small" plain
                    @click="handleSubmitAudit">提审</el-button>
                <el-tooltip v-else-if="versionType === WXTaskN.VersionType.TEST"
                    :disabled="item.audit_status === WXReviewStatus.SUCCESS" content="审核通过后才能发布"
                    placement="top">
                    <span class="publish-button-wrap">
                        <el-button size="small" plain :disabled="item.audit_status !== WXReviewStatus.SUCCESS"
                            @click="handleSubmitPublish">发布</el-button>
                    </span>
                </el-tooltip>
            </div>
        </div>
        <div v-if="item.time" class="card-time">{{ formatTime(item.time) }}</div>
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
        <div v-if="versionType === WXTaskN.VersionType.TEST
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
</template>

<script setup lang="ts">
import { WXReviewStatusDict } from '@mp-assistant/common/dist/constant';
import { WXReviewStatus, type VersionListItem } from '@mp-assistant/common/dist/types/wx';
import { TaskType, WXTaskN, type BaseTaskInfo } from '@mp-assistant/common/dist/work/task';
import type { WXMPItem } from '@mp-assistant/common/dist/types/wx';
import { VersionPositioningCriteria, VersionPositioningType } from '@mp-assistant/common/dist/utils/wx';
import { dayjs, ElMessage } from 'element-plus';
import { CopyDocument } from '@element-plus/icons-vue';
import { computed, inject } from 'vue';
import type { AddTaskFormData } from '@/component/AddTaskDialog/index';

const props = withDefaults(defineProps<{
    item: VersionListItem;
    versionType: WXTaskN.VersionType;
    wxmpItem: WXMPItem;
    relatedTask: BaseTaskInfo[];
    onlineVersion?: VersionListItem | null;
}>(), {
    onlineVersion: null,
});

const handleAddTask = inject<(formData?: AddTaskFormData, presetAppIds?: string[]) => void>('handleAddTask');

const cardAccentClass = computed(() => {
    const type = props.versionType;
    const item = props.item;
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
});

const isSameAsOnline = computed(() => {
    const online = props.onlineVersion;
    const item = props.item;
    if (!online) return false;
    return item.version === online.version
        && item.nick_name === online.nick_name
        && item.describe === online.describe;
});

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

const buildPositioner = () => {
    const item = props.item;
    return [
        { type: VersionPositioningType.Version, criteria: VersionPositioningCriteria.Equal, value: item.version || '' },
        { type: VersionPositioningType.NickName, criteria: VersionPositioningCriteria.Equal, value: item.nick_name || '' },
        { type: VersionPositioningType.Describe, criteria: VersionPositioningCriteria.Equal, value: item.describe || '' },
    ];
};

const handleSubmitAudit = () => {
    const item = props.item;
    const nearestAuditTaskOptions = props.relatedTask.find(task => task.type === TaskType.WX_AUDIT)?.options as WXTaskN.AuditTaskOptions | undefined;
    handleAddTask?.(
        {
            type: TaskType.WX_AUDIT,
            positioner: buildPositioner(),
            populateData: {
                versionDescription: nearestAuditTaskOptions?.populateData?.versionDescription || '',
                imagePreview: (nearestAuditTaskOptions?.populateData?.imagePreview?.split(',') || []).filter(Boolean),
                videoPreview: (nearestAuditTaskOptions?.populateData?.videoPreview?.split(',') || []).filter(Boolean),
            },
        },
        [props.wxmpItem.appid],
    );
};

const handleSubmitPublish = () => {
    handleAddTask?.(
        {
            type: TaskType.WX_PUBLISH,
            positioner: buildPositioner(),
        },
        [props.wxmpItem.appid],
    );
};
</script>

<style scoped lang="scss">
@use "./index.scss";
</style>
