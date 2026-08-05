<template>
  <el-dialog v-model="visible" title="添加任务" width="420px" @close="resetForm">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
      <el-form-item label="类型" prop="type">
        <el-select v-model="form.type" style="width: 100%">
          <el-option v-for="opt in WXTaskTypeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="handleSubmit" :loading="addLoading">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { ElMessage } from "element-plus";
import type { FormInstance, FormRules } from "element-plus";
import { requestAddTask } from "@/api";
import { useApiCall } from "@/hooks/useApiCall";
import { WXTaskTypeOptions, WXTaskType } from "@mp-assistant/common/dist/work/const.js";

const { call: callAdd, loading: addLoading } = useApiCall(requestAddTask);

const visible = ref(false);
const formRef = ref<FormInstance>();
const currentWorkerKey = ref("");

const form = reactive({
  type: WXTaskType.WX_LOGIN as string,
});

const rules: FormRules = {
  type: [{ required: true, message: "请选择任务类型", trigger: "change" }],
};

const resetForm = () => {
  form.type = WXTaskType.WX_LOGIN;
  currentWorkerKey.value = "";
  formRef.value?.resetFields();
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  await formRef.value.validate();
  try {
    await callAdd({
      key: currentWorkerKey.value,
      type: form.type as WXTaskType,
      options: {},
    });
    ElMessage.success("添加成功");
    visible.value = false;
  } catch {
    // 错误已在 request 中处理
  }
};

const open = (workerKey: string) => {
  resetForm();
  currentWorkerKey.value = workerKey;
  visible.value = true;
};

defineExpose({ open });
</script>

<style scoped lang="scss">
@use "./index.scss";
</style>
