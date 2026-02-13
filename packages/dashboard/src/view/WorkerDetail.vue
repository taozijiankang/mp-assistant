<template>
  <div class="worker-detail" v-if="worker">
    <!-- Worker 基本信息 -->
    <div class="worker-detail__header">
      <div class="header-left">
        <div class="worker-name-row">
          <template v-if="!isEditing">
            <h3 class="worker-name">{{ worker.name || worker.key.slice(0, 8) }}</h3>
            <el-button :icon="Edit" size="small" text @click="startEdit" />
          </template>
          <template v-else>
            <el-input v-model="editName" size="small" style="width: 200px" @keyup.enter="handleSaveName" />
            <el-button size="small" type="primary" @click="handleSaveName" :loading="saveLoading">保存</el-button>
            <el-button size="small" @click="isEditing = false">取消</el-button>
          </template>
        </div>
        <div class="worker-meta">
          <el-tag size="small" effect="plain">{{ WorkerTypeDict[worker.type] }}</el-tag>
          <el-col>
            <el-row>
              <span class="meta-text">Key: {{ worker.key }}</span>
            </el-row>
            <el-row>
              <span class="meta-text">当前运行任务key: {{ worker.currentRunningTaskKey }}</span>
            </el-row>
          </el-col>
        </div>
      </div>
    </div>

    <!-- 微信登录二维码 -->
    <div class="worker-detail__qrcode" v-if="wxWorkerInfo?.loginQRCodeURL">
      <div class="qrcode-card">
        <el-image :src="wxWorkerInfo.loginQRCodeURL" fit="contain" class="qrcode-img" />
        <span class="qrcode-tip">请使用微信扫码登录</span>
      </div>
    </div>
    <el-tabs v-model="activeTab" class="demo-tabs">
      <el-tab-pane :label="`关联小程序 (${wxWorkerInfo?.wxaList.length || 0})`" name="apps">
      </el-tab-pane>
      <el-tab-pane :label="`运行中任务 (${worker?.taskList.length || 0})`" name="running-tasks">
      </el-tab-pane>
      <el-tab-pane :label="`已完成任务 (${worker?.succeedTaskList.length || 0})`" name="succeed-tasks">
      </el-tab-pane>
    </el-tabs>
    <div class="content">
      <!-- 小程序列表 -->
      <div class="worker-detail__apps" v-if="activeTab === 'apps' && wxWorkerInfo && wxWorkerInfo.wxaList.length > 0">
        <div class="worker-detail__apps-header">
          <el-input v-model="searchWxaName" placeholder="搜索小程序" />
          <span class="app-count">已选中{{ onSelectWxaAppIds.length }}个小程序</span>
          <el-button type="primary" size="small" @click="handleSelectAllWxaApp">全部选中</el-button>
          <el-button type="primary" size="small" @click="handleUnselectAllWxaApp">全部取消</el-button>
          <el-button type="primary" size="small" @click="addTaskDialogVisible = true">添加任务</el-button>
        </div>
        <div class="apps-grid">
          <div class="app-card" v-for="app in wxWorkerInfo.wxaList.filter(app => app.app_name.includes(searchWxaName))"
            :key="app.appid">
            <el-checkbox :model-value="onSelectWxaAppIds.includes(app.appid)" @change="(v: boolean) => {
              if (v) {
                onSelectWxaAppIds.push(app.appid);
              } else {
                let index = onSelectWxaAppIds.indexOf(app.appid);
                if (index !== -1) {
                  onSelectWxaAppIds.splice(index, 1);
                }
              }
            }" />
            <el-avatar :src="app.app_headimg" :size="40" shape="square">
              {{ app.app_name?.charAt(0) }}
            </el-avatar>
            <div class="app-info">
              <div class="app-name">{{ app.app_name }}</div>
              <div class="app-meta">
                <span class="app-id">{{ app.appid }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="worker-detail__tasks" v-if="activeTab === 'running-tasks'">
        <el-table :data="worker.taskList" style="width: 100%" empty-text="暂无任务" stripe>
          <el-table-column label="类型" width="140">
            <template #default="{ row }">
              {{ TaskTypeDict[row.type as TaskType] }}
            </template>
          </el-table-column>
          <el-table-column label="状态" width="120">
            <template #default="{ row }">
              <el-tag :type="getStatusTagType(row.status)" size="small" effect="light">
                {{ TaskStatusDict[row.status as TaskStatus] }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="进度" min-width="200">
            <template #default="{ row }">
              <span v-if="row.runningReportList.length > 0" class="report-latest">
                {{ row.runningReportList[row.runningReportList.length - 1].title }}
              </span>
              <span v-else class="text-muted">-</span>
            </template>
          </el-table-column>
          <el-table-column label="当前运行" width="80" align="center">
            <template #default="{ row }">
              <el-icon v-if="worker!.currentRunningTaskKey === row.key" color="#67c23a">
                <VideoPlay />
              </el-icon>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="140" fixed="right">
            <template #default="{ row }">
              <el-button size="small" text type="primary" @click="$emit('viewTask', worker!.key, row.key)">
                详情
              </el-button>
              <el-button size="small" text type="danger" @click="handleRemoveTask(row.key)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div v-if="activeTab === 'succeed-tasks'" class="worker-detail__tasks">
        <!-- 已完成的任务 -->
        <template v-if="worker.succeedTaskList.length > 0">
          <el-divider content-position="left">
            <span style="font-size: 13px; color: #909399">已完成的任务 ({{ worker.succeedTaskList.length }})</span>
          </el-divider>
          <el-table :data="worker.succeedTaskList" style="width: 100%" stripe>
            <el-table-column label="类型" width="140">
              <template #default="{ row }">
                {{ TaskTypeDict[row.type as TaskType] }}
              </template>
            </el-table-column>
            <el-table-column label="状态" width="120">
              <template #default="{ row }">
                <el-tag :type="getStatusTagType(row.status)" size="small" effect="light">
                  {{ TaskStatusDict[row.status as TaskStatus] }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="结果" min-width="200">
              <template #default="{ row }">
                <span v-if="row.result">{{ row.result.message || '-' }}</span>
                <span v-else class="text-muted">-</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80" fixed="right">
              <template #default="{ row }">
                <el-button size="small" text type="primary" @click="$emit('viewTask', worker!.key, row.key)">
                  详情
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </template>
        <template v-else>
          <el-empty description="暂无已完成任务" :image-size="120" />
        </template>
      </div>
    </div>
  </div>

  <div class="worker-detail--empty" v-else>
    <el-empty description="请从左侧选择一个 Worker" :image-size="120" />
  </div>

  <el-dialog v-model="addTaskDialogVisible" title="添加任务" width="500px">
    <el-form :model="addTaskForm" label-width="100px">
      <el-form-item label="任务类型">
        <el-select v-model="addTaskForm.type" placeholder="请选择任务类型">
          <el-option v-for="item in TaskTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="addTaskDialogVisible = false">取消</el-button>
      <el-button type="primary" @click="handleAddTask">添加</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { Edit, Plus, VideoPlay } from "@element-plus/icons-vue";
import { WorkerTypeDict, WorkerType } from "mp-assistant-common/dist/work/index.js";
import { TaskType, TaskStatus, TaskTypeDict, TaskStatusDict, TaskTypeOptions } from "mp-assistant-common/dist/work/task/index.js";
import type { BaseWorkInfo, WXWorkInfo } from "mp-assistant-common/dist/work/type.js";
import { updateWorker, addTask, removeTask } from "../api/worker";
import { ElMessage, ElMessageBox } from "element-plus";

const props = defineProps<{
  worker?: BaseWorkInfo;
}>();

defineEmits<{
  refresh: [];
  viewTask: [workerKey: string, taskKey: string];
}>();

const activeTab = ref<"apps" | "running-tasks" | "succeed-tasks">("apps");

// 当 worker 是微信类型时，转为 WXWorkInfo 类型
const wxWorkerInfo = computed(() => {
  if (props.worker?.type === WorkerType.WX) {
    return props.worker as unknown as WXWorkInfo;
  }
  return undefined;
});

const searchWxaName = ref("");

const onSelectWxaAppIds = ref<string[]>([]);

const isEditing = ref(false);
const editName = ref("");
const saveLoading = ref(false);

const addTaskDialogVisible = ref(false);
const addTaskForm = ref({
  type: TaskType.WX_INSPECT_VERSION,
});

watch(
  () => props.worker?.key,
  () => {
    isEditing.value = false;
  }
);

function startEdit() {
  editName.value = props.worker?.name || "";
  isEditing.value = true;
}

function handleSelectAllWxaApp() {
  onSelectWxaAppIds.value = wxWorkerInfo.value?.wxaList.map(app => app.appid) || [];
}

function handleUnselectAllWxaApp() {
  onSelectWxaAppIds.value = [];
}

async function handleAddTask() {
  if (!props.worker) return;
  try {
    await addTask(props.worker.key, {
      type: addTaskForm.value.type,
      params: {},
    });
    ElMessage.success("添加成功");
    addTaskDialogVisible.value = false;
  } catch (e: any) {
    ElMessage.error(e.message || "添加失败");
  }
}

async function handleSaveName() {
  if (!props.worker) return;
  saveLoading.value = true;
  try {
    await updateWorker(props.worker.key, { name: editName.value });
    ElMessage.success("修改成功");
    isEditing.value = false;
  } catch (e: any) {
    ElMessage.error(e.message || "修改失败");
  } finally {
    saveLoading.value = false;
  }
}

async function handleRemoveTask(taskKey: string) {
  if (!props.worker) return;
  try {
    await ElMessageBox.confirm("确定要删除该任务吗？", "提示", {
      type: "warning",
    });
  } catch {
    return;
  }
  try {
    await removeTask(props.worker.key, taskKey);
    ElMessage.success("删除成功");
  } catch (e: any) {
    ElMessage.error(e.message || "删除任务失败");
  }
}

function getStatusTagType(status: TaskStatus): "success" | "warning" | "danger" | "info" | "primary" {
  switch (status) {
    case TaskStatus.COMPLETED:
      return "success";
    case TaskStatus.RUNNING:
      return "primary";
    case TaskStatus.WAITING_RESULT:
      return "warning";
    case TaskStatus.FAILED:
      return "danger";
    default:
      return "info";
  }
}
</script>

<style lang="scss" scoped>
.worker-detail {
  display: flex;
  flex-direction: column;
  height: 100%;

  &__header {
    padding: 16px 20px;
    border-bottom: 1px solid #ebeef5;
    flex-shrink: 0;

    .header-left {
      .worker-name-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;

        .worker-name {
          margin: 0;
          font-size: 18px;
          color: #303133;
        }
      }

      .worker-meta {
        display: flex;
        align-items: center;
        gap: 10px;

        .meta-text {
          font-size: 12px;
          color: #909399;
          font-family: monospace;
        }
      }
    }
  }

  &__qrcode {
    padding: 16px 20px;
    border-bottom: 1px solid #ebeef5;
    flex-shrink: 0;

    .qrcode-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 16px;
      background: #f5f7fa;
      border-radius: 8px;
      border: 1px dashed #dcdfe6;

      .qrcode-img {
        width: 180px;
        height: 180px;
      }

      .qrcode-tip {
        font-size: 13px;
        color: #909399;
      }
    }
  }

  &__apps {
    padding: 20px;
    flex-shrink: 0;
    border-bottom: 1px solid #ebeef5;
    gap: 10px;
    display: flex;
    flex-direction: column;



    .section-header {
      padding: 12px 0;

      .title {
        font-size: 15px;
        font-weight: 600;
        color: #303133;
      }
    }

    .apps-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      padding-bottom: 16px;



      .app-card {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 14px;
        background: #fafafa;
        border: 1px solid #ebeef5;
        border-radius: 8px;
        min-width: 240px;
        max-width: 320px;
        transition: box-shadow 0.2s;

        &:hover {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }

        .app-info {
          min-width: 0;
          flex: 1;

          .app-name {
            font-size: 14px;
            font-weight: 500;
            color: #303133;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .app-meta {
            display: flex;
            align-items: center;
            gap: 6px;
            margin-top: 2px;

            .app-id {
              font-size: 11px;
              color: #909399;
              font-family: monospace;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
          }
        }
      }
    }
  }

  &__tasks {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;

    .tasks-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 20px;
      flex-shrink: 0;

      .title {
        font-size: 15px;
        font-weight: 600;
        color: #303133;
      }
    }

    .tasks-body {
      flex: 1;
      min-height: 0;
      padding: 0 20px 20px;
    }
  }

  .demo-tabs {
    padding: 0 20px;

    ::v-deep(.el-tabs__header.is-top) {
      margin-bottom: 0;
    }
  }

  .content {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow-y: auto;
  }

  &--empty {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
  }
}

.text-muted {
  color: #c0c4cc;
}

.report-latest {
  font-size: 13px;
  color: #606266;
}
</style>
