<template>
  <div class="task-detail">
    <template v-if="task">
      <div class="detail-header">
        <div class="detail-title">
          <span class="detail-name">{{ WXTaskTypeDict[task.type] }}</span>
          <el-tag :type="statusTagType" size="small">{{ TaskStatusDict[task.status] }}</el-tag>
        </div>
      </div>

      <div class="detail-body">
        <div class="detail-row">
          <span class="label">类型</span>
          <span>{{ WXTaskTypeDict[task.type] }}</span>
        </div>
        <div class="detail-row">
          <span class="label">状态</span>
          <span>{{ TaskStatusDict[task.status] }}</span>
        </div>
        <div class="detail-row">
          <span class="label">创建时间</span>
          <span>{{ task.createdTime }}</span>
        </div>
        <div v-if="task.type === WXTaskType.WX_LOGIN" class="detail-row">
          <span class="label">操作</span>
          <span :class="(task as any).options.action === 'logout' ? 'text-logout' : 'text-login'">
            {{ (task as any).options.action === 'logout' ? '退出登录' : '登录' }}
          </span>
        </div>
        <div v-if="showWxaInfo" class="detail-row">
          <span class="label">小程序</span>
          <template v-if="wxaItem">
            <img :src="wxaItem.app_headimg" class="detail-app-avatar" />
            <span>{{ wxaItem.app_name }}</span>
          </template>
          <span v-else>{{ (task as any).options.appId }}</span>
        </div>
        <div v-if="positioners.length" class="detail-row detail-msg-row">
          <span class="label">筛选条件</span>
          <div class="detail-value">
            <div v-for="(p, i) in positioners" :key="i" class="positioner-item">
              {{ formatPositioner(p) }}
            </div>
          </div>
        </div>
        <div v-if="auditInfo?.options.populateData?.versionDescription" class="detail-row detail-msg-row">
          <span class="label">版本描述</span>
          <span class="detail-value">{{ auditInfo.options.populateData.versionDescription }}</span>
        </div>
        <div v-if="auditImagePreviews.length" class="detail-row detail-msg-row">
          <span class="label">图片预览</span>
          <div class="detail-value audit-previews">
            <el-image
              v-for="(img, i) in auditImagePreviews"
              :key="i"
              :src="getFileUrl(img)"
              :preview-src-list="auditImagePreviews.map(getFileUrl)"
              :initial-index="i"
              preview-teleported
              fit="cover"
              class="audit-preview-image"
            />
          </div>
        </div>
        <div v-if="auditInfo?.options.populateData?.videoPreview" class="detail-row detail-msg-row">
          <span class="label">视频预览</span>
          <div class="detail-value">
            <video :src="getFileUrl(auditInfo.options.populateData.videoPreview)" controls class="audit-preview-video" />
          </div>
        </div>
        <div
          v-if="task.completedMessage && (task.status === TaskStatus.COMPLETED || task.status === TaskStatus.FAILED)"
          class="detail-row detail-msg-row"
        >
          <span class="label">{{ task.status === TaskStatus.FAILED ? '失败原因' : '完成信息' }}</span>
          <span class="detail-value">{{ task.completedMessage }}</span>
        </div>

        <div v-if="task.reports.length > 0" class="reports-section">
          <div class="reports-title">报告 ({{ task.reports.length }})</div>
          <div class="reports-list">
            <div
              v-for="(report, index) in task.reports"
              :key="index"
              class="report-item"
              :class="report.type"
            >
              <template v-if="report.type === 'text'">
                <span class="report-time">{{ formatTime(report.time) }}</span>
                <span class="report-msg">{{ report.message }}</span>
              </template>
              <template v-else>
                <span class="report-time">{{ formatTime(report.time) }}</span>
                <el-image :src="report.message" :preview-src-list="[report.message]" fit="contain" class="report-image" />
              </template>
            </div>
          </div>
        </div>

        <div v-if="task.status === TaskStatus.RUNNING && task.loginQRCode" class="detail-row qrcode-row">
          <span class="label">登录二维码</span>
          <img :src="task.loginQRCode" class="qrcode-image" />
        </div>

        <div
          v-if="publishInfo && task.status === TaskStatus.RUNNING && publishInfo.publishQRCode"
          class="detail-row qrcode-row"
        >
          <span class="label">发布二维码</span>
          <div class="publish-qrcode-wrap">
            <img :src="publishInfo.publishQRCode" class="qrcode-image" />
            <span v-if="publishInfo.publishCountdown != null" class="publish-countdown">
              {{ formatCountdown(publishInfo.publishCountdown) }}
            </span>
          </div>
        </div>

        <div v-if="wxaList.length > 0" class="wxa-section">
          <div class="section-title">小程序列表 ({{ wxaList.length }})</div>
          <div class="wxa-list">
            <div v-for="item in wxaList" :key="item.appid" class="wxa-item">
              <img :src="item.app_headimg" class="wxa-avatar" />
              <span class="wxa-name">{{ item.app_name }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="detail-actions">
        <el-button
          v-if="task.status === TaskStatus.RUNNING"
          size="small"
          type="warning"
          @click="$emit('abort')"
        >
          终止
        </el-button>
        <el-button
          v-if="task.status === TaskStatus.FAILED || task.status === TaskStatus.COMPLETED"
          size="small"
          @click="$emit('reset')"
        >
          重置
        </el-button>
        <el-button size="small" type="danger" @click="$emit('remove')">删除</el-button>
      </div>
    </template>

    <div v-else class="detail-empty">
      <span>请选择一个任务</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { WXTaskInfo } from "@mp-assistant/common/dist/work/wx/WXTask.js";
import type { WXLoginTaskInfo } from "@mp-assistant/common/dist/work/wx/tasks/WXLoginTask.js";
import type { WXAuditTaskInfo } from "@mp-assistant/common/dist/work/wx/tasks/WXAuditTask.js";
import type { WXPublishTaskInfo } from "@mp-assistant/common/dist/work/wx/tasks/WXPublishTask.js";
import type { WXMPItem } from "@mp-assistant/common/dist/types/wx.js";
import { TaskStatus, TaskStatusDict, WXTaskTypeDict, WXTaskType } from "@mp-assistant/common/dist/work/const.js";
import { VersionPositioningTypeDict, VersionPositioningCriteriaDict } from "@mp-assistant/common/dist/utils/index.js";
import type { VersionPositioner } from "@mp-assistant/common/dist/utils/index.js";
import { getFileUrl } from "@/api";

const props = defineProps<{
  task: WXTaskInfo | null;
  wxaList?: WXMPItem[];
}>();

defineEmits<{
  abort: [];
  reset: [];
  remove: [];
}>();

const statusTagType = computed(() => {
  if (!props.task) return "info";
  switch (props.task.status) {
    case TaskStatus.RUNNING: return "warning";
    case TaskStatus.COMPLETED: return "success";
    case TaskStatus.FAILED: return "danger";
    default: return "info";
  }
});

const isWXLoginTask = computed(() => props.task?.type === WXTaskType.WX_LOGIN);

const wxaList = computed<WXMPItem[]>(() => {
  if (!isWXLoginTask.value) return [];
  return (props.task as WXLoginTaskInfo).wxaList ?? [];
});

// 需要展示小程序信息的任务类型：检查版本 / 审核 / 发布
const showWxaInfo = computed(() =>
  props.task != null &&
  [WXTaskType.WX_INSPECT_VERSION, WXTaskType.WX_AUDIT, WXTaskType.WX_PUBLISH].includes(props.task.type as WXTaskType)
);

const wxaItem = computed(() => {
  if (!showWxaInfo.value || !props.task) return null;
  const appId = (props.task.options as any).appId as string;
  return props.wxaList?.find(item => item.appid === appId) ?? null;
});

const publishInfo = computed<WXPublishTaskInfo | null>(() =>
  props.task?.type === WXTaskType.WX_PUBLISH ? (props.task as WXPublishTaskInfo) : null
);

// 审核任务的参数：筛选条件 + 审核内容（版本描述/图片/视频）
const auditInfo = computed<WXAuditTaskInfo | null>(() =>
  props.task?.type === WXTaskType.WX_AUDIT ? (props.task as WXAuditTaskInfo) : null
);

// 审核/发布任务都有的版本筛选条件
const positioners = computed(() => {
  if (!props.task) return [];
  if (props.task.type === WXTaskType.WX_AUDIT) return auditInfo.value?.options.positioner ?? [];
  if (props.task.type === WXTaskType.WX_PUBLISH) return publishInfo.value?.options.positioner ?? [];
  return [];
});

const formatPositioner = (p: VersionPositioner) => {
  const typeDict = VersionPositioningTypeDict as Record<string, string>;
  const criteriaDict = VersionPositioningCriteriaDict as Record<string, string>;
  return `${typeDict[p.type]} · ${criteriaDict[p.criteria]} · ${p.value}`;
};

const auditImagePreviews = computed(() => auditInfo.value?.options.populateData?.imagePreviews ?? []);

const formatTime = (timestamp: number) => {
  const d = new Date(timestamp);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

const formatCountdown = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};
</script>

<style scoped lang="scss">
@use "./index.scss";
</style>
