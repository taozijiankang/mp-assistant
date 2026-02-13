<template>
  <div class="worker-list">
    <div class="worker-list__header">
      <span class="title">Worker 列表</span>
      <el-dropdown @command="handleAddWorker">
        <el-button type="primary" size="small" :icon="Plus" :loading="addLoading">
          新增
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item
              v-for="(label, value) in WorkerTypeDict"
              :key="value"
              :command="value"
            >
              {{ label }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <el-scrollbar class="worker-list__body">
      <div
        v-for="worker in workerList"
        :key="worker.key"
        class="worker-item"
        :class="{ active: selectedKey === worker.key }"
        @click="$emit('select', worker.key)"
      >
        <div class="worker-item__info">
          <div class="worker-item__name">
            <el-tag size="small" type="primary" effect="plain">
              {{ WorkerTypeDict[worker.type] }}
            </el-tag>
            <span class="name-text">{{ worker.name || worker.key.slice(0, 8) }}</span>
          </div>
          <div class="worker-item__meta">
            <span>任务: {{ worker.taskList.length }}</span>
            <span>已完成: {{ worker.succeedTaskList.length }}</span>
          </div>
        </div>
        <div class="worker-item__actions" @click.stop>
          <el-button
            type="danger"
            size="small"
            :icon="Delete"
            circle
            plain
            @click="handleRemoveWorker(worker.key)"
          />
        </div>
      </div>

      <el-empty v-if="workerList.length === 0" description="暂无 Worker" :image-size="80" />
    </el-scrollbar>
  </div>
</template>

<script setup lang="ts">
import { Plus, Delete } from "@element-plus/icons-vue";
import { WorkerTypeDict, WorkerType } from "mp-assistant-common/dist/work/index.js";
import type { BaseWorkInfo } from "mp-assistant-common/dist/work/type.js";
import { ref } from "vue";
import { addWorker, removeWorker } from "../api/worker";
import { ElMessage, ElMessageBox } from "element-plus";

defineProps<{
  workerList: BaseWorkInfo[];
  selectedKey?: string;
}>();

const emit = defineEmits<{
  select: [key: string];
  refresh: [];
}>();

const addLoading = ref(false);

async function handleAddWorker(type: WorkerType) {
  addLoading.value = true;
  try {
    const res = await addWorker({ type });
    ElMessage.success("添加成功");
    emit("refresh");
    if (res.data) {
      emit("select", res.data.key);
    }
  } catch (e: any) {
    ElMessage.error(e.message || "添加失败");
  } finally {
    addLoading.value = false;
  }
}

async function handleRemoveWorker(key: string) {
  try {
    await ElMessageBox.confirm("确定要删除该 Worker 吗？", "提示", {
      type: "warning",
    });
  } catch {
    return;
  }
  try {
    await removeWorker(key);
    ElMessage.success("删除成功");
    emit("refresh");
  } catch (e: any) {
    ElMessage.error(e.message || "删除失败");
  }
}
</script>

<style lang="scss" scoped>
.worker-list {
  display: flex;
  flex-direction: column;
  height: 100%;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid #ebeef5;
    flex-shrink: 0;

    .title {
      font-size: 15px;
      font-weight: 600;
      color: #303133;
    }
  }

  &__body {
    flex: 1;
    min-height: 0;
  }
}

.worker-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  border-bottom: 1px solid #f2f3f5;

  &:hover {
    background-color: #f5f7fa;
  }

  &.active {
    background-color: #ecf5ff;
  }

  &__info {
    flex: 1;
    min-width: 0;
  }

  &__name {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;

    .name-text {
      font-size: 14px;
      color: #303133;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  &__meta {
    display: flex;
    gap: 12px;
    font-size: 12px;
    color: #909399;
  }

  &__actions {
    flex-shrink: 0;
    margin-left: 8px;
  }
}
</style>

