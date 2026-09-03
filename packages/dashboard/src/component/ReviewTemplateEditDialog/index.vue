<template>
  <el-dialog v-model="visible" title="审核模板管理" width="760px" @close="resetState">
    <div class="template-editor">
      <div class="template-list">
        <div class="template-list-header">
          <span>模板列表</span>
          <el-button size="small" type="primary" plain @click="addTemplate">新增模板</el-button>
        </div>
        <div v-if="templates.length === 0" class="template-list-empty">暂无模板</div>
        <div
          v-for="(tpl, i) in templates"
          :key="i"
          class="template-item"
          :class="{ active: activeIndex === i }"
          @click="activeIndex = i"
        >
          <span class="template-name">{{ tpl.name || "未命名模板" }}</span>
          <el-button type="danger" size="small" circle plain @click.stop="removeTemplate(i)">
            <el-icon><Delete /></el-icon>
          </el-button>
        </div>
      </div>
      <div class="template-detail">
        <template v-if="activeTemplate">
          <el-form label-width="80px">
            <el-form-item label="名称">
              <el-input v-model="activeTemplate.name" placeholder="请输入模板名称" />
            </el-form-item>
            <el-form-item label="版本描述">
              <el-input v-model="activeTemplate.versionDescription" type="textarea" :rows="3" placeholder="请输入版本描述" />
            </el-form-item>
            <el-form-item label="图片预览">
              <FilesUpload v-model:files="activeTemplate.imagePreviews" accept="image/*" multiple />
            </el-form-item>
            <el-form-item label="视频预览">
              <FilesUpload v-model:files="videoPreviews" accept="video/*" :max="1" />
            </el-form-item>
          </el-form>
        </template>
        <div v-else class="template-detail-empty">请选择或新增一个模板</div>
      </div>
    </div>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="handleSubmit" :loading="reviewTemplateStore.saving">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Delete } from "@element-plus/icons-vue";
import type { ReviewTemplate } from "@mp-assistant/common/dist/types/reviewTemplate.js";
import { useReviewTemplateStore } from "@/stores/reviewTemplate";
import FilesUpload from "@/component/FilesUpload/index.vue";

const reviewTemplateStore = useReviewTemplateStore();

const visible = ref(false);
const templates = ref<ReviewTemplate[]>([]);
const activeIndex = ref(-1);

const activeTemplate = computed(() => templates.value[activeIndex.value] ?? null);

// 视频预览在数据里是单值，FilesUpload 用数组，这里做转换
const videoPreviews = computed<string[]>({
  get: () => (activeTemplate.value?.videoPreview ? [activeTemplate.value.videoPreview] : []),
  set: (val) => {
    if (activeTemplate.value) {
      activeTemplate.value.videoPreview = val[0];
    }
  },
});

const resetState = () => {
  templates.value = [];
  activeIndex.value = -1;
};

const open = () => {
  visible.value = true;
  templates.value = (reviewTemplateStore.reviewTemplateList ?? []).map(t => ({
    ...t,
    imagePreviews: [...(t.imagePreviews ?? [])],
  }));
  activeIndex.value = templates.value.length ? 0 : -1;
};

const addTemplate = () => {
  templates.value.push({ name: "", versionDescription: "", imagePreviews: [] });
  activeIndex.value = templates.value.length - 1;
};

const removeTemplate = async (i: number) => {
  const tpl = templates.value[i];
  try {
    await ElMessageBox.confirm(`确定删除模板 "${tpl?.name || "未命名模板"}" 吗？`, "删除确认", {
      type: "warning"
    });
  } catch {
    return;
  }
  templates.value.splice(i, 1);
  if (activeIndex.value >= templates.value.length) {
    activeIndex.value = templates.value.length - 1;
  }
};

const handleSubmit = async () => {
  if (templates.value.some(t => !t.name.trim())) {
    ElMessage.warning("请为所有模板填写名称");
    return;
  }
  try {
    const payload: ReviewTemplate[] = templates.value.map(t => {
      const item: ReviewTemplate = {
        name: t.name.trim(),
        versionDescription: t.versionDescription.trim(),
        imagePreviews: t.imagePreviews,
      };
      if (t.videoPreview) item.videoPreview = t.videoPreview;
      return item;
    });
    await reviewTemplateStore.setReviewTemplates(payload);
    ElMessage.success("保存成功");
    visible.value = false;
  } catch {
    // 错误已在 request 中处理
  }
};

defineExpose({ open });
</script>

<style scoped lang="scss">
@use "./index.scss";
</style>
