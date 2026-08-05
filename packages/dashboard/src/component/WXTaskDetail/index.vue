<template>
  <div class="task-detail">
    <template v-if="task">
      <div class="detail-header">
        <div class="detail-title">
          <span class="detail-name">{{ WXTaskTypeDict[task.type] }}</span>
          <el-tag :type="statusTagType" size="small">{{ TaskStatusDict[task.status] }}</el-tag>
        </div>
        <span class="detail-key">{{ task.key }}</span>
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
        <div
          v-if="task.completedMessage && (task.status === TaskStatus.COMPLETED || task.status === TaskStatus.FAILED)"
          class="detail-row"
        >
          <span class="label">{{ task.status === TaskStatus.FAILED ? '失败原因' : '完成信息' }}</span>
          <span>{{ task.completedMessage }}</span>
        </div>
        <div v-if="task.isLogin !== undefined" class="detail-row">
          <span class="label">登录状态</span>
          <el-tag :type="task.isLogin ? 'success' : 'warning'" size="small">
            {{ task.isLogin ? '已登录' : '未登录' }}
          </el-tag>
        </div>
        <div v-if="task.loginQRCode && !task.isLogin" class="detail-row qrcode-row">
          <span class="label">登录二维码</span>
          <img :src="task.loginQRCode" class="qrcode-image" />
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
                <img :src="report.message" class="report-image" />
              </template>
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
import type { WXMPItem } from "@mp-assistant/common/dist/types/wx.js";
import { TaskStatus, TaskStatusDict, WXTaskTypeDict, WXTaskType } from "@mp-assistant/common/dist/work/const.js";

const props = defineProps<{
  task: WXTaskInfo | null;
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

const formatTime = (timestamp: number) => {
  const d = new Date(timestamp);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};
</script>

<style scoped lang="scss">
@use "./index.scss";
</style>
