<template>
  <el-dialog
    :model-value="visible"
    title="系统配置"
    width="480px"
    @close="emit('close')"
    close-on-click-modal
  >
    <el-form
      v-if="form"
      :model="form"
      label-width="120px"
      label-position="right"
      size="default"
    >
      <el-form-item label="浏览器路径">
        <el-input v-model="form.executablePath" placeholder="Chrome/Chromium 可执行文件路径" />
      </el-form-item>
      <el-form-item label="无头模式">
        <el-switch v-model="form.headless" />
        <span class="form-tip">开启后浏览器将在后台运行</span>
      </el-form-item>
      <el-form-item label="服务端口">
        <el-input-number v-model="form.port" :min="1024" :max="65535" />
      </el-form-item>
    </el-form>

    <div class="loading-wrap" v-else>
      <el-icon class="is-loading" :size="24"><Loading /></el-icon>
    </div>

    <template #footer>
      <el-button @click="emit('close')">取消</el-button>
      <el-button type="primary" @click="handleSave" :loading="saveLoading">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { Loading } from "@element-plus/icons-vue";
import type { Config } from "mp-assistant-common/dist/types/config.js";
import { getConfig, setConfig } from "../api/config";
import { ElMessage } from "element-plus";

const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const form = ref<Config | null>(null);
const saveLoading = ref(false);

watch(
  () => props.visible,
  async (val) => {
    if (val) {
      try {
        const res = await getConfig();
        form.value = res.data ? { ...res.data } : null;
      } catch {
        form.value = null;
      }
    }
  },
  { immediate: true }
);

async function handleSave() {
  if (!form.value) return;
  saveLoading.value = true;
  try {
    await setConfig(form.value);
    ElMessage.success("配置已保存");
    emit('close');
  } catch (e: any) {
    ElMessage.error(e.message || "保存失败");
  } finally {
    saveLoading.value = false;
  }
}
</script>

<style lang="scss" scoped>
.form-tip {
  margin-left: 8px;
  font-size: 12px;
  color: #909399;
}

.loading-wrap {
  display: flex;
  justify-content: center;
  padding: 40px;
  color: #909399;
}
</style>

