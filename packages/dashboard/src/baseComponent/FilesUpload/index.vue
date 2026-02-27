<template>
    <div class="files-upload-container">
        <div class="files-container">
            <div class="files-item" v-for="(file, index) in files" :key="index">
                <img class="file-image" v-if="/\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(file)" :src="getFileUrl(file)" />
                <video class="file-video" v-else-if="/\.(mp4|webm|ogg|flv|avi|mov|wmv|mkv)$/i.test(file)"
                    :src="getFileUrl(file)" controls />
                <span class="file-name" v-else>{{ file }}</span>
                <el-button class="file-remove-button" type="danger" @click="handleRemoveFile(index)" circle>
                    <el-icon>
                        <Delete />
                    </el-icon>
                </el-button>
            </div>
        </div>
        <div class="files-upload-add" v-if="multiple ? files.length < max : files.length <= 0">
            <el-button type="primary" @click="handleAddFile">添加文件</el-button>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { requestUploadFile } from '@/api';
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import { Delete } from '@element-plus/icons-vue';

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
}>()

const uploadLoading = ref(false);

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
}

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
}

const handleRemoveFile = (index: number) => {
    emit('update:files', props.files.filter((_, i) => i !== index))
}

const getFileUrl = (file: string) => {
    return new URL(file, import.meta.env.VITE_BASE_API_URL).href;
}
</script>

<style scoped lang="scss">
@use "./index.scss";
</style>