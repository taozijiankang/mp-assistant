<template>
  <el-dialog v-model="visible" title="设置" width="420px" @close="resetForm">
    <el-form v-loading="getLoading" label-width="90px">
      <el-form-item label="无头模式">
        <el-switch v-model="form.headless" />
      </el-form-item>
      <el-form-item label="端口号">
        <el-input-number v-model="form.port" :min="1" :max="65535" style="width: 100%" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="handleSubmit" :loading="setLoading">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { ElMessage } from "element-plus";
import { requestGetConfig, requestSetConfig } from "@/api";
import { useApiCall } from "@/hooks/useApiCall";

const { call: callGet, loading: getLoading } = useApiCall(requestGetConfig);
const { call: callSet, loading: setLoading } = useApiCall(requestSetConfig);

const visible = ref(false);

// 默认值与后端 ConfigStore 的 DEFAULT_CONFIG 保持一致
const form = reactive({
  headless: true,
  port: 3001
});

const resetForm = () => {
  form.headless = true;
  form.port = 3001;
};

const open = async () => {
  resetForm();
  visible.value = true;
  try {
    const res = await callGet();
    form.headless = res.data.headless;
    form.port = res.data.port;
  } catch {
    // 拉取失败时保留默认值，错误已在 request 中提示
  }
};

const handleSubmit = async () => {
  try {
    await callSet({ headless: form.headless, port: form.port });
    ElMessage.success("保存成功");
    visible.value = false;
  } catch {}
};

defineExpose({ open });
</script>
