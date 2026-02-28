<template>
    <div class="version-list">
        <template v-for="versionListInfo in showVersionList">
            <div class="title" :class="{
                'online': versionListInfo.type === WXTaskN.VersionType.ONLINE,
                'test': versionListInfo.type === WXTaskN.VersionType.TEST,
                'dev': versionListInfo.type === WXTaskN.VersionType.DEVELOP,
            }">
                <div class="dot"></div>
                <span>{{ versionListInfo.title }}</span>
            </div>
            <div class="version-item-list">
                <div v-for="item in versionListInfo.versions" class="version-item">
                    <div class="col">
                        <div class="row">
                            <span>
                                版本：{{ item?.version }} <span v-if="item.is_exper" style="color: #00ACFF">[体验版本]</span>
                            </span>
                        </div>
                        <div class="row">
                            <span>发布者: {{ item?.nick_name }}</span>
                        </div>
                        <div v-if="byDescribeGetCommitHash(item?.describe || '')" class="row">
                            <span>
                                GIT提交HASH:
                                <span class="commit-hash">
                                    {{ byDescribeGetCommitHash(item?.describe || '') }}
                                </span>
                            </span>
                        </div>
                    </div>
                    <div class="col">
                        <div class="row">
                            <span>操作:</span>
                            <el-button v-if="versionListInfo.type === WXTaskN.VersionType.DEVELOP" size="small" plain
                                @click="handleSubmitAudit(item)">添加提审任务</el-button>
                        </div>
                    </div>
                    <div v-if="versionListInfo.type === WXTaskN.VersionType.TEST" class="col">
                        <div class="row">
                            <span>审核状态:
                                <span class="audit-status" :class="{
                                    'success': item?.audit_status === WXReviewStatus.SUCCESS,
                                    'reviewing': item?.audit_status === WXReviewStatus.REVIEWING,
                                    'fail': item?.audit_status === WXReviewStatus.FAIL,
                                }">{{ WXReviewStatusDict[item?.audit_status as WXReviewStatus] }}</span>
                            </span>
                        </div>
                    </div>
                    <div class="col">
                        <div class="row">
                            <span>备注: {{ item?.describe }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { WXReviewStatusDict } from 'mp-assistant-common/dist/constant';
import { WXReviewStatus, type VersionListItem } from 'mp-assistant-common/dist/types/wx';
import { TaskType, WXTaskN, type BaseTaskInfo } from 'mp-assistant-common/dist/work/task';
import { computed, inject } from 'vue';
import type { AddTaskFormData } from '../../../AddTaskDialog/index';
import type { WXMPItem } from 'mp-assistant-common/dist/types/wx';
import { VersionPositioningCriteria } from 'mp-assistant-common/dist/utils/wx';
import { VersionPositioningType } from 'mp-assistant-common/dist/utils/wx';

const props = defineProps<{
    wxmpItem: WXMPItem;
    relatedTask: BaseTaskInfo[];
    inspectVersionTaskInfo: WXTaskN.InspectVersionInfo,
}>();

const handleAddTask = inject<(formData?: AddTaskFormData) => void>('handleAddTask');

const versionList = computed(() => {
    return props.inspectVersionTaskInfo.result?.data as WXTaskN.VersionListData | undefined
});

const onlineVersion = computed(() => {
    return versionList.value?.[WXTaskN.VersionType.ONLINE]
});
const testVersion = computed(() => {
    return versionList.value?.[WXTaskN.VersionType.TEST]
});
const devVersions = computed(() => {
    return versionList.value?.[WXTaskN.VersionType.DEVELOP] || []
});

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
            versions: [testVersion.value].filter(Boolean) as VersionListItem[],
        },
        {
            title: '开发版本',
            type: WXTaskN.VersionType.DEVELOP,
            versions: devVersions.value as VersionListItem[],
        }
    ].filter(item => item.versions.length > 0);
});

const handleSubmitAudit = (item: VersionListItem) => {
    // 找到最近的审核任务 选项
    const nearestAuditTaskOptions = props.relatedTask.find(task => task.type === TaskType.WX_AUDIT)?.options as WXTaskN.AuditTaskOptions | undefined;
    handleAddTask?.({
        appIds: [props.wxmpItem.appid],
        type: TaskType.WX_AUDIT,
        positioner: [
            {
                type: VersionPositioningType.Version,
                criteria: VersionPositioningCriteria.Equal,
                value: item.version || '',
            },
            {
                type: VersionPositioningType.NickName,
                criteria: VersionPositioningCriteria.Equal,
                value: item.nick_name || '',
            },
            {
                type: VersionPositioningType.Describe,
                criteria: VersionPositioningCriteria.Equal,
                value: item.describe || '',
            }
        ],
        populateData: {
            versionDescription: nearestAuditTaskOptions?.populateData?.versionDescription || '',
            imagePreview: (nearestAuditTaskOptions?.populateData?.imagePreview?.split(',') || []).filter(Boolean),
            videoPreview: (nearestAuditTaskOptions?.populateData?.videoPreview?.split(',') || []).filter(Boolean),
        }
    });
}

/**
 * 根据描述获取commit hash
 * @param describe 描述
 * @returns commit hash
 */
const byDescribeGetCommitHash = (describe: string) => {
    const commitHash = describe.match(/提交信息[:：]?\s*([a-f0-9]{7,40})/)?.[1];
    return commitHash
}
</script>

<style scoped lang="scss">
@use "./index.scss";
</style>