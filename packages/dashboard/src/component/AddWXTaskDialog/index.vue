<template>
  <el-dialog v-model="visible" title="添加任务" width="560px" @close="resetForm">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
      <el-form-item label="类型" prop="type">
        <el-radio-group v-model="form.type">
          <el-radio-button v-for="opt in WXTaskTypeOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </el-radio-button>
        </el-radio-group>
      </el-form-item>
      <el-form-item v-if="form.type === WXTaskType.WX_LOGIN" label="操作" prop="action">
        <el-radio-group v-model="form.action">
          <el-radio value="login">登录</el-radio>
          <el-radio value="logout">退出登录</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item v-if="isAppIdRequired" label="小程序" prop="appId">
        <el-select v-model="form.appId" style="width: 100%" placeholder="请选择小程序" filterable>
          <el-option v-for="item in (wxaList ?? [])" :key="item.appid" :label="item.app_name" :value="item.appid" />
        </el-select>
      </el-form-item>

      <template v-if="isPositionerRequired">
        <el-form-item label="筛选条件" prop="positioners">
          <div class="positioner-list">
            <div v-for="(p, i) in form.positioners" :key="i" class="positioner-item">
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
              <el-input v-model="p.value" placeholder="匹配值" />
              <el-button type="danger" circle plain @click="form.positioners.splice(i, 1)">
                <el-icon><Delete /></el-icon>
              </el-button>
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
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="handleSubmit" :loading="addLoading">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import { ElMessage } from "element-plus";
import type { FormInstance, FormRules } from "element-plus";
import { Delete } from "@element-plus/icons-vue";
import { requestAddTask } from "@/api";
import { useApiCall } from "@/hooks/useApiCall";
import { WXTaskTypeOptions, WXTaskType } from "@mp-assistant/common/dist/work/const.js";
import type {
  WXLoginTaskOptions,
  WXInspectVersionTaskOptions,
  WXAuditTaskOptions,
  WXPublishTaskOptions,
} from "@mp-assistant/common/dist/work/index.js";
import {
  VersionPositioningType,
  VersionPositioningTypeOptions,
  VersionPositioningCriteria,
  VersionPositioningCriteriaOptions,
} from "@mp-assistant/common/dist/utils/index.js";
import type { VersionPositioner } from "@mp-assistant/common/dist/utils/index.js";
import type { WXMPItem } from "@mp-assistant/common/dist/types/wx.js";
import FilesUpload from "@/component/FilesUpload/index.vue";

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
  positioners: [] as VersionPositioner[],
  versionDescription: '',
  imagePreviews: [] as string[],
  videoPreviews: [] as string[],
});

const isAppIdRequired = computed(() =>
  form.type === WXTaskType.WX_INSPECT_VERSION || form.type === WXTaskType.WX_AUDIT || form.type === WXTaskType.WX_PUBLISH
);

const isPositionerRequired = computed(() =>
  form.type === WXTaskType.WX_AUDIT || form.type === WXTaskType.WX_PUBLISH
);

const rules: FormRules = {
  type: [{ required: true, message: "请选择任务类型", trigger: "change" }],
  appId: [{
    required: true,
    validator: (_rule, _value, callback) => {
      if (isAppIdRequired.value && !form.appId) {
        callback(new Error("请选择小程序"));
      } else {
        callback();
      }
    },
    trigger: "change",
  }],
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

const resetForm = () => {
  form.type = WXTaskType.WX_LOGIN;
  form.action = 'login';
  form.appId = '';
  form.positioners = [];
  form.versionDescription = '';
  form.imagePreviews = [];
  form.videoPreviews = [];
  currentWorkerKey.value = "";
  formRef.value?.resetFields();
};

const addPositioner = () => {
  form.positioners.push({
    type: VersionPositioningType.Describe,
    criteria: VersionPositioningCriteria.Inclusion,
    value: '',
  });
};

// 过滤掉匹配值为空的条件
const buildPositioners = () => form.positioners.filter(p => p.value.trim());

const buildAuditOptions = (): WXAuditTaskOptions => {
  const populateData: WXAuditTaskOptions["populateData"] = {
    versionDescription: form.versionDescription.trim(),
  };
  if (form.imagePreviews.length) populateData.imagePreviews = form.imagePreviews;
  if (form.videoPreviews[0]) populateData.videoPreview = form.videoPreviews[0];
  return {
    appId: form.appId,
    positioner: buildPositioners(),
    populateData,
  };
};

const buildPublishOptions = (): WXPublishTaskOptions => {
  return {
    appId: form.appId,
    positioner: buildPositioners(),
  };
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  await formRef.value.validate();
  const type = form.type as WXTaskType;
  let options: WXLoginTaskOptions | WXInspectVersionTaskOptions | WXAuditTaskOptions | WXPublishTaskOptions | {};
  if (type === WXTaskType.WX_LOGIN) {
    options = { action: form.action } as WXLoginTaskOptions;
  } else if (type === WXTaskType.WX_INSPECT_VERSION) {
    options = { appId: form.appId } as WXInspectVersionTaskOptions;
  } else if (type === WXTaskType.WX_AUDIT) {
    options = buildAuditOptions();
  } else if (type === WXTaskType.WX_PUBLISH) {
    options = buildPublishOptions();
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
