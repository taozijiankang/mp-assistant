<template>
  <div class="index">
    <!-- 顶部导航 -->
    <div class="header">
      <div class="header__left">
        <h1 class="header__title">小程序助手</h1>
      </div>
      <div class="header__right">
        <el-button :icon="Setting" text circle @click="configVisible = true" />
      </div>
    </div>

    <!-- 主体内容 -->
    <div class="main">
      <!-- 左侧 Worker 列表 -->
      <div class="main__sidebar">
        <WorkerList :worker-list="workerList" :selected-key="selectedWorkerKey" @select="handleSelectWorker"
          @refresh="refreshWorkerList" />
      </div>

      <!-- 右侧详情区 -->
      <div class="main__content">
        <WorkerDetail :worker="selectedWorker" @refresh="refreshWorkerList" @view-task="handleViewTask" />
      </div>
    </div>

    <!-- 配置对话框 -->
    <ConfigDialog :visible="configVisible" @close="configVisible = false" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { Setting } from "@element-plus/icons-vue";
import type { BaseWorkInfo } from "mp-assistant-common/dist/work/type.js";
import { getWorkerInfos } from "../api/worker";
import WorkerList from "./WorkerList.vue";
import WorkerDetail from "./WorkerDetail.vue";
import ConfigDialog from "./ConfigDialog.vue";

// Worker 列表数据
const workerList = ref<BaseWorkInfo[]>([]);
const selectedWorkerKey = ref<string>();
const refreshLoading = ref(false);

// 计算当前选中的 Worker
const selectedWorker = computed(() => {
  return workerList.value.find((w) => w.key === selectedWorkerKey.value);
});

// 任务详情抽屉
const taskDrawerVisible = ref(false);
const taskDrawerWorkerKey = ref<string>();
const taskDrawerTaskKey = ref<string>();

// 配置对话框
const configVisible = ref(false);

const mounted = ref(false);

onMounted(() => {
  refreshWorkerList();
  mounted.value = true;
});

onUnmounted(() => {
  mounted.value = false;
});

async function refreshWorkerList() {
  refreshLoading.value = true;
  try {
    const res = await getWorkerInfos();
    workerList.value = res.data ?? [];
    // 如果选中的 worker 已被删除，清除选中
    if (selectedWorkerKey.value && !workerList.value.find((w) => w.key === selectedWorkerKey.value)) {
      selectedWorkerKey.value = undefined;
    }
    // 如果当前没有选择则选择第一个
    if (!selectedWorkerKey.value && workerList.value.length > 0) {
      selectedWorkerKey.value = workerList.value[0].key;
    }

    setTimeout(() => {
      if (mounted.value) {
        refreshWorkerList();
      }
    }, 1000);
  } catch {
    // 静默处理轮询错误
  } finally {
    refreshLoading.value = false;
  }
}

function handleSelectWorker(key: string) {
  selectedWorkerKey.value = key;
}

function handleViewTask(workerKey: string, taskKey: string) {
  taskDrawerWorkerKey.value = workerKey;
  taskDrawerTaskKey.value = taskKey;
  taskDrawerVisible.value = true;
}
</script>

<style lang="scss" scoped>
@use "./index.scss";
</style>
