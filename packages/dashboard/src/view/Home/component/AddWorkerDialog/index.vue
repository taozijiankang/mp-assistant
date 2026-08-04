<template>
  <el-dialog v-model="visible" title="添加 Worker" width="420px" @close="resetForm">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <el-form-item label="名称" prop="name">
        <el-input v-model="form.name" placeholder="请输入名称" />
      </el-form-item>
      <el-form-item label="权重" prop="weight">
        <el-input-number v-model="form.weight" :min="0" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="handleSubmit" :loading="loading">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { ElMessage } from "element-plus";
import type { FormInstance, FormRules } from "element-plus";
import { requestAddWXWorker } from "@/api";
import { useApiCall } from "@/hooks/useApiCall";

const { call, loading } = useApiCall(requestAddWXWorker);

const visible = ref(false);
const formRef = ref<FormInstance>();

const form = reactive({
  name: "",
  weight: 0,
});

const rules: FormRules = {
  name: [{ required: true, message: "请输入名称", trigger: "blur" }],
};

const resetForm = () => {
  form.name = "";
  form.weight = 0;
  formRef.value?.resetFields();
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  await formRef.value.validate();
  try {
    await call({ ...form, syncTaskNum: 1 });
    visible.value = false;
    ElMessage.success("添加成功");
  } catch {
    // 错误已在 request 中处理
  }
};

const open = () => {
  resetForm();
  visible.value = true;
};

defineExpose({ open });
</script>

<style scoped lang="scss">
@use "./index.scss";
</style>
