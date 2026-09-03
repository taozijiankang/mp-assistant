<template>
  <div class="files-upload">
    <div class="files-grid">
      <div v-for="(filePath, index) in files" :key="index" class="file-card">
        <el-image
          v-if="isImage(filePath)"
          :src="getFileUrl(filePath)"
          :preview-src-list="imageSrcs"
          :initial-index="imageIndex(filePath)"
          preview-teleported
          fit="cover"
          class="file-thumb"
        />
        <div v-else-if="isVideo(filePath)" class="file-thumb video-thumb" @click.stop="openVideoPreview(filePath)">
          <video :src="getFileUrl(filePath)" preload="metadata" muted />
          <span class="video-play"></span>
        </div>
        <div v-else class="file-other">
          <el-icon class="file-other-icon"><Document /></el-icon>
          <span class="file-other-name">{{ fileName(filePath) }}</span>
        </div>
        <span class="file-remove" @click.stop="handleRemoveFile(index)">
          <el-icon><Close /></el-icon>
        </span>
      </div>

      <div v-if="canAdd" class="file-add" @click="handleAddFile">
        <el-icon class="file-add-icon"><Plus /></el-icon>
      </div>
    </div>

    <div v-if="files.length === 0" class="files-empty">暂无文件，点击 + 上传</div>

    <el-dialog
      v-model="videoPreviewVisible"
      title="视频预览"
      width="640px"
      append-to-body
      :z-index="3000"
      destroy-on-close
    >
      <video v-if="previewVideo" :src="previewVideo" controls autoplay class="video-preview-player" />
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { Plus, Close, Document } from '@element-plus/icons-vue';
import { getFileUrl, requestUploadFile } from '@/api';

const props = withDefaults(defineProps<{
    files: string[];
    // 多选
    multiple?: boolean;
    accept: string;
    // 最大上传文件数
    max?: number;
}>(), {
    multiple: false,
    max: 10,
});

const emit = defineEmits<{
    (e: 'update:files', value: string[]): void
}>();

const uploadLoading = ref(false);

const isImage = (path: string) => /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(path);
const isVideo = (path: string) => /\.(mp4|webm|ogg|flv|avi|mov|wmv|mkv)$/i.test(path);
const fileName = (path: string) => path.split('/').pop() ?? path;

const canAdd = computed(() =>
    props.multiple ? props.files.length < props.max : props.files.length <= 0
);

const imageSrcs = computed(() => props.files.filter(isImage).map(f => getFileUrl(f)));
const imageIndex = (filePath: string) => props.files.filter(isImage).indexOf(filePath);

const videoPreviewVisible = ref(false);
const previewVideo = ref<string | null>(null);

const openVideoPreview = (filePath: string) => {
    previewVideo.value = getFileUrl(filePath);
    videoPreviewVisible.value = true;
};

const handleAddFile = () => {
    const input = document.createElement('input');
    input.style.display = 'none';
    document.body.appendChild(input);
    input.accept = props.accept;
    input.type = 'file';
    input.multiple = props.multiple;
    input.onchange = async (...args) => {
        await handleFileChange(...args);
        input.remove();
    };
    input.click();
};

const handleFileChange = async (event: Event) => {
    const files = (event.target as HTMLInputElement).files || [];
    if (files.length + props.files.length > props.max) {
        ElMessage.error(`最多上传${props.max}个文件`);
        return;
    }
    try {
        uploadLoading.value = true;
        for (const file of files) {
            const { data } = await requestUploadFile(file);
            emit('update:files', [...props.files, data]);
        }
    } finally {
        uploadLoading.value = false;
    }
};

const handleRemoveFile = (index: number) => {
    emit('update:files', props.files.filter((_, i) => i !== index));
};
</script>

<style scoped lang="scss">
@use "./index.scss";
</style>
