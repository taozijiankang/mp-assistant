<template>
  <el-dialog v-model="visible" :title="editKey ? '编辑 Worker' : '添加 Worker'" width="420px" @close="resetForm">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <el-form-item label="类型" prop="type">
        <el-select v-model="form.type" :disabled="!!editKey" style="width: 100%">
          <el-option v-for="opt in WorkerTypeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="名称" prop="name">
        <el-input v-model="form.name" placeholder="请输入名称" />
      </el-form-item>
      <el-form-item label="权重" prop="weight">
        <el-input-number v-model="form.weight" :min="0" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="handleSubmit" :loading="addLoading || updateLoading">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { ElMessage } from "element-plus";
import type { FormInstance, FormRules } from "element-plus";
import { requestAddWXWorker, requestUpdateWorker } from "@/api";
import { useApiCall } from "@/hooks/useApiCall";
import { WorkerTypeOptions, WorkerType } from "@mp-assistant/common/dist/work/const.js";
import type { BaseWorkerInfo } from "@mp-assistant/common/dist/work/BaseWorker.js";

const { call: callAdd, loading: addLoading } = useApiCall(requestAddWXWorker);
const { call: callUpdate, loading: updateLoading } = useApiCall(requestUpdateWorker);

const visible = ref(false);
const formRef = ref<FormInstance>();
const editKey = ref<string | null>(null);

const form = reactive({
  type: WorkerType.WX as string,
  name: "",
  weight: 0
});

const rules: FormRules = {
  name: [{ required: true, message: "请输入名称", trigger: "blur" }]
};

const resetForm = () => {
  form.type = WorkerType.WX;
  form.name = "";
  form.weight = 0;
  editKey.value = null;
  formRef.value?.resetFields();
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  await formRef.value.validate();
  try {
    if (editKey.value) {
      await callUpdate({ key: editKey.value, ...form });
      ElMessage.success("更新成功");
    } else {
      await callAdd({ ...form, syncTaskNum: 1 });
      ElMessage.success("添加成功");
    }
    visible.value = false;
  } catch {
    // 错误已在 request 中处理
  }
};

const open = (worker?: BaseWorkerInfo) => {
  resetForm();
  if (worker) {
    editKey.value = worker.key;
    form.name = worker.options.name;
    form.weight = worker.options.weight ?? 0;
  }
  visible.value = true;
};

defineExpose({ open });
</script>

<style scoped lang="scss">
@use "./index.scss";
</style>
