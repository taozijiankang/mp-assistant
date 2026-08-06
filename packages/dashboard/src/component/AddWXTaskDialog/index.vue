<template>
  <el-dialog v-model="visible" title="添加任务" width="420px" @close="resetForm">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
      <el-form-item label="类型" prop="type">
        <el-select v-model="form.type" style="width: 100%">
          <el-option v-for="opt in WXTaskTypeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
        </el-select>
      </el-form-item>
      <el-form-item v-if="form.type === WXTaskType.WX_LOGIN" label="操作" prop="action">
        <el-radio-group v-model="form.action">
          <el-radio value="login">登录</el-radio>
          <el-radio value="logout">退出登录</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item v-if="form.type === WXTaskType.WX_INSPECT_VERSION" label="小程序" prop="appId">
        <el-select v-model="form.appId" style="width: 100%" placeholder="请选择小程序">
          <el-option v-for="item in (wxaList ?? [])" :key="item.appid" :label="item.app_name" :value="item.appid" />
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
import type { WXLoginTaskOptions, WXInspectVersionTaskOptions } from "@mp-assistant/common/dist/work/index.js";
import type { WXMPItem } from "@mp-assistant/common/dist/types/wx.js";

const { call: callAdd, loading: addLoading } = useApiCall(requestAddTask);

const props = defineProps<{
  wxaList?: WXMPItem[];
}>();

const visible = ref(false);
const formRef = ref<FormInstance>();
const currentWorkerKey = ref("");

const form = reactive({
  type: WXTaskType.WX_LOGIN as string,
  action: 'login' as 'login' | 'logout',
  appId: '',
});

const rules: FormRules = {
  type: [{ required: true, message: "请选择任务类型", trigger: "change" }],
  appId: [{
    validator: (_rule, _value, callback) => {
      if (form.type === WXTaskType.WX_INSPECT_VERSION && !form.appId) {
        callback(new Error("请选择小程序"));
      } else {
        callback();
      }
    },
    trigger: "change",
  }],
};

const resetForm = () => {
  form.type = WXTaskType.WX_LOGIN;
  form.action = 'login';
  form.appId = '';
  currentWorkerKey.value = "";
  formRef.value?.resetFields();
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  await formRef.value.validate();
  const type = form.type as WXTaskType;
  let options: WXLoginTaskOptions | WXInspectVersionTaskOptions | {};
  if (type === WXTaskType.WX_LOGIN) {
    options = { action: form.action } as WXLoginTaskOptions;
  } else if (type === WXTaskType.WX_INSPECT_VERSION) {
    options = { appId: form.appId } as WXInspectVersionTaskOptions;
  } else {
    options = {};
  }
  try {
    await callAdd({
      key: currentWorkerKey.value,
      type,
      options,
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
