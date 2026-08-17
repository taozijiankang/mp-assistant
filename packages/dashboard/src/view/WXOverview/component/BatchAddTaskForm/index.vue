<template>
  <div class="batch-form">
    <div class="batch-form-title">批量添加任务</div>

    <el-form ref="formRef" :model="form" :rules="rules" label-width="80px" size="small">
      <el-form-item label="类型" prop="type">
        <el-radio-group v-model="form.type">
          <el-radio-button v-for="opt in typeOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </el-radio-button>
        </el-radio-group>
      </el-form-item>

      <template v-if="isPositionerRequired">
        <el-form-item label="筛选条件" prop="positioners">
          <div class="positioner-list">
            <div v-for="(p, i) in form.positioners" :key="i" class="positioner-item">
              <div class="positioner-row">
                <el-select v-model="p.type" class="positioner-type">
                  <el-option
                    v-for="opt in VersionPositioningTypeOptions"
                    :key="opt.value"
                    :label="opt.label"
                    :value="opt.value"
                  />
                </el-select>
                <el-select v-model="p.criteria" class="positioner-criteria">
                  <el-option
                    v-for="opt in VersionPositioningCriteriaOptions"
                    :key="opt.value"
                    :label="opt.label"
                    :value="opt.value"
                  />
                </el-select>
                <el-button type="danger" circle plain @click="form.positioners.splice(i, 1)">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
              <el-input v-model="p.value" placeholder="匹配值" />
            </div>
            <el-button class="positioner-add" plain @click="addPositioner">添加条件</el-button>
          </div>
        </el-form-item>
      </template>

      <template v-if="form.type === WXTaskType.WX_AUDIT">
        <el-form-item label="版本描述" prop="versionDescription">
          <el-input v-model="form.versionDescription" type="textarea" :rows="3" placeholder="请输入版本描述" />
        </el-form-item>

        <el-form-item label="图片预览">
          <FilesUpload v-model:files="form.imagePreviews" accept="image/*" multiple />
        </el-form-item>

        <el-form-item label="视频预览">
          <FilesUpload v-model:files="form.videoPreviews" accept="video/*" :max="1" />
        </el-form-item>
      </template>
    </el-form>

    <el-button type="primary" class="batch-submit" :loading="submitting" @click="handleSubmit">
      批量添加
    </el-button>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import { ElMessage } from "element-plus";
import type { FormInstance, FormRules } from "element-plus";
import { Delete } from "@element-plus/icons-vue";
import { requestAddTask } from "@/api";
import { WXTaskType, WXTaskTypeOptions } from "@mp-assistant/common/dist/work/const.js";
import {
  VersionPositioningType,
  VersionPositioningTypeOptions,
  VersionPositioningCriteria,
  VersionPositioningCriteriaOptions,
} from "@mp-assistant/common/dist/utils/index.js";
import type { VersionPositioner } from "@mp-assistant/common/dist/utils/index.js";
import type { WXAuditTaskOptions } from "@mp-assistant/common/dist/work/index.js";
import FilesUpload from "@/component/FilesUpload/index.vue";
import type { SelectedCell } from "../../index";

const props = defineProps<{
  selectedCells: SelectedCell[];
}>();

const emit = defineEmits<{
  done: [];
}>();

const formRef = ref<FormInstance>();
const submitting = ref(false);

const typeOptions = WXTaskTypeOptions.filter(opt => opt.value !== WXTaskType.WX_LOGIN);

const form = reactive({
  type: WXTaskType.WX_AUDIT as string,
  positioners: [] as VersionPositioner[],
  versionDescription: "",
  imagePreviews: [] as string[],
  videoPreviews: [] as string[],
});

const isPositionerRequired = computed(() =>
  form.type === WXTaskType.WX_AUDIT || form.type === WXTaskType.WX_PUBLISH
);

const rules: FormRules = {
  type: [{ required: true, message: "请选择任务类型", trigger: "change" }],
  positioners: [{
    required: true,
    validator: (_rule, _value, callback) => {
      if (isPositionerRequired.value && !form.positioners.some(p => p.value.trim())) {
        callback(new Error("请至少添加一个筛选条件"));
      } else {
        callback();
      }
    },
    trigger: "change",
  }],
  versionDescription: [{
    required: true,
    validator: (_rule, _value, callback) => {
      if (!form.versionDescription.trim()) {
        callback(new Error("请输入版本描述"));
      } else {
        callback();
      }
    },
    trigger: "blur",
  }],
};

const addPositioner = () => {
  form.positioners.push({
    type: VersionPositioningType.Describe,
    criteria: VersionPositioningCriteria.Inclusion,
    value: "",
  });
};

const buildPositioners = () => form.positioners.filter(p => p.value.trim());

const buildBody = (cell: SelectedCell) => {
  const type = form.type as WXTaskType;
  if (type === WXTaskType.WX_INSPECT_VERSION) {
    return { key: cell.workerKey, type, options: { appId: cell.appid } };
  }
  if (type === WXTaskType.WX_PUBLISH) {
    return { key: cell.workerKey, type, options: { appId: cell.appid, positioner: buildPositioners() } };
  }
  const populateData: WXAuditTaskOptions["populateData"] = {
    versionDescription: form.versionDescription.trim(),
  };
  if (form.imagePreviews.length) populateData.imagePreviews = form.imagePreviews;
  if (form.videoPreviews[0]) populateData.videoPreview = form.videoPreviews[0];
  return {
    key: cell.workerKey,
    type,
    options: { appId: cell.appid, positioner: buildPositioners(), populateData },
  };
};

const handleSubmit = async () => {
  if (!props.selectedCells.length) {
    ElMessage.warning("请先在表格中选择小程序");
    return;
  }
  if (!formRef.value) return;
  try {
    await formRef.value.validate();
  } catch {
    return;
  }
  submitting.value = true;
  try {
    await Promise.all(props.selectedCells.map(cell => requestAddTask(buildBody(cell))));
    ElMessage.success(`已批量添加 ${props.selectedCells.length} 个任务`);
    emit("done");
  } catch {
    // 错误已在 request 中处理
  } finally {
    submitting.value = false;
  }
};
</script>

<style scoped lang="scss">
@use "./index.scss";
</style>
