<template>
  <div class="worker-detail">
    <template v-if="worker">
      <div class="detail-header">
        <div class="detail-title">
          <span class="detail-name">{{ worker.options.name }}</span>
          <el-tag :type="statusTagType" size="small">{{ statusLabel }}</el-tag>
        </div>
        <span class="detail-key">{{ worker.key }}</span>
      </div>

      <div class="detail-body">
        <div class="detail-row">
          <span class="label">名称</span>
          <template v-if="editing">
            <el-input v-model="editName" size="small" style="width: 160px" />
          </template>
          <span v-else>{{ worker.options.name }}</span>
        </div>
        <div class="detail-row">
          <span class="label">权重</span>
          <template v-if="editing">
            <el-input-number v-model="editWeight" size="small" :min="0" style="width: 160px" />
          </template>
          <span v-else>{{ worker.options.weight ?? '-' }}</span>
        </div>
        <div class="detail-row">
          <span class="label">并发任务数</span>
          <span>{{ worker.options.syncTaskNum }}</span>
        </div>
        <div class="detail-row">
          <span class="label">创建时间</span>
          <span>{{ worker.createdTime }}</span>
        </div>
      </div>

      <div class="detail-actions">
        <template v-if="editing">
          <el-button type="primary" size="small" @click="handleSaveEdit">保存</el-button>
          <el-button size="small" @click="editing = false">取消</el-button>
        </template>
        <template v-else>
          <el-button size="small" @click="handleEdit">编辑</el-button>
          <el-button
            size="small"
            :type="worker.status === WorkerStatus.RUNNING ? 'warning' : 'success'"
            @click="handleToggleSuspend"
          >
            {{ worker.status === WorkerStatus.PAUSED ? '恢复' : '暂停' }}
          </el-button>
          <el-button size="small" type="danger" @click="handleDelete">删除</el-button>
        </template>
      </div>
    </template>

    <div v-else class="detail-empty">
      <span>请选择一个 Worker</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import type { BaseWorkerInfo } from "@mp-assistant/common/dist/work/BaseWorker.js";
import { WorkerStatus, WorkerStatusDict } from "@mp-assistant/common/dist/work/const.js";

const props = defineProps<{
  worker: BaseWorkerInfo | null;
}>();

const emit = defineEmits<{
  update: [values: { name?: string; weight?: number }];
  toggleSuspend: [];
  remove: [];
}>();

const editing = ref(false);
const editName = ref("");
const editWeight = ref<number | undefined>();

const statusLabel = computed(() => {
  if (!props.worker) return "";
  return WorkerStatusDict[props.worker.status] || props.worker.status;
});

const statusTagType = computed(() => {
  if (!props.worker) return "info";
  switch (props.worker.status) {
    case WorkerStatus.RUNNING: return "success";
    case WorkerStatus.PAUSED: return "warning";
    default: return "info";
  }
});

const handleEdit = () => {
  if (!props.worker) return;
  editName.value = props.worker.options.name;
  editWeight.value = props.worker.options.weight;
  editing.value = true;
};

const handleSaveEdit = () => {
  emit("update", {
    name: editName.value,
    weight: editWeight.value,
  });
  editing.value = false;
};

const handleToggleSuspend = () => {
  emit("toggleSuspend");
};

const handleDelete = () => {
  emit("remove");
};
</script>

<style scoped lang="scss">
@use "./index.scss";
</style>
