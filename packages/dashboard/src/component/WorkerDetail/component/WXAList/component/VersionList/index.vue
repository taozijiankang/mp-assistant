<template>
    <div class="version-list">
        <template v-if="onlineVersion">
            <div class="title online">
                <div class="dot"></div>
                <span>线上版本</span>
            </div>
            <div class="version-item-list">
                <div class="version-item">
                    <div class="col">
                        <div class="row">
                            <span>版本：{{ onlineVersion?.version }}</span>
                        </div>
                        <div class="row">
                            <span>发布者: {{ onlineVersion?.nick_name }}</span>
                        </div>
                        <div v-if="byDescribeGetCommitHash(onlineVersion?.describe || '')" class="row">
                            <span>
                                提交 hash:
                                <span class="commit-hash">
                                    {{ byDescribeGetCommitHash(onlineVersion?.describe || '') }}
                                </span>
                            </span>
                        </div>
                    </div>
                    <div class="col">
                        <div class="row">
                            <span>备注: {{ onlineVersion?.describe }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </template>
        <template v-if="testVersion">
            <div class="title test">
                <div class="dot"></div>
                <span>审核版本</span>
            </div>
            <div class="version-item-list">
                <div class="version-item">
                    <div class="col">
                        <div class="row">
                            <span>版本：{{ testVersion?.version }}</span>
                        </div>
                        <div class="row">
                            <span>发布者: {{ testVersion?.nick_name }}</span>
                        </div>
                        <div v-if="byDescribeGetCommitHash(testVersion?.describe || '')" class="row">
                            <span>
                                提交 hash:
                                <span class="commit-hash">
                                    {{ byDescribeGetCommitHash(testVersion?.describe || '') }}
                                </span>
                            </span>
                        </div>
                    </div>
                    <div class="col">
                        <div class="row">
                            <span>审核状态:
                                <span class="audit-status" :class="{
                                    'success': testVersion?.audit_status === WXReviewStatus.SUCCESS,
                                    'reviewing': testVersion?.audit_status === WXReviewStatus.REVIEWING,
                                    'fail': testVersion?.audit_status === WXReviewStatus.FAIL,
                                }">{{ WXReviewStatusDict[testVersion?.audit_status as WXReviewStatus] }}</span>
                            </span>
                        </div>
                    </div>
                    <div class="col">
                        <div class="row">
                            <span>备注: {{ testVersion?.describe }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </template>
        <template v-if="devVersions.length > 0">
            <div class="title dev">
                <div class="dot"></div>
                <span>开发版本</span>
            </div>
            <div class="version-item-list">
                <div v-for="item in devVersions" class="version-item">
                    <div class="col">
                        <div class="row">
                            <span>版本：{{ item?.version }} <span v-if="item.is_exper"
                                    style="color: #00ACFF">[体验版本]</span></span>
                        </div>
                        <div class="row">
                            <span>发布者: {{ item?.nick_name }}</span>
                        </div>
                        <div v-if="byDescribeGetCommitHash(item?.describe || '')" class="row">
                            <span>
                                提交 hash:
                                <span class="commit-hash">
                                    {{ byDescribeGetCommitHash(item?.describe || '') }}
                                </span>
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
        <div class="task-info">
            <div class="top">
                <span>关联任务: </span>
                <span>{{ TaskTypeDict[taskInfo.type] }}</span>
                <div class="task-status" :class="{
                    'success': taskInfo.status === TaskStatus.COMPLETED,
                    'reviewing': taskInfo.status === TaskStatus.RUNNING,
                    'fail': taskInfo.status === TaskStatus.FAILED,
                }">
                    <div class="dot"></div>
                    <span>
                        {{ TaskStatusDict[taskInfo.status] }}
                    </span>
                </div>
            </div>
            <span>{{ taskInfo.key }} {{ dayjs(taskInfo.result?.endTimestamp || 0).format('YYYY-MM-DD HH:mm:ss')
                }}</span>
        </div>
    </div>
</template>

<script setup lang="ts">
import { WXReviewStatusDict } from 'mp-assistant-common/dist/constant';
import { WXReviewStatus } from 'mp-assistant-common/dist/types/wx';
import { TaskStatus, TaskStatusDict, TaskTypeDict, WXTaskN } from 'mp-assistant-common/dist/work/task';
import { computed } from 'vue';
import { dayjs } from 'element-plus';

const props = defineProps<{
    taskInfo: WXTaskN.InspectVersionInfo
}>();

const versionList = computed(() => {
    return props.taskInfo.result?.data as WXTaskN.VersionListData | undefined
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