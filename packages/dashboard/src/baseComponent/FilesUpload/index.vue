<template>
    <div class="files-upload-container">
        <div class="files-container">
            <div class="files-item" v-for="(filePath, index) in files" :key="index">
                <img class="file-image" v-if="/\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(filePath)"
                    :src="getFileUrl(filePath)" />
                <video class="file-video" v-else-if="/\.(mp4|webm|ogg|flv|avi|mov|wmv|mkv)$/i.test(filePath)"
                    :src="getFileUrl(filePath)" controls />
                <span class="file-name" v-else>{{ filePath }}</span>
                <el-button class="file-remove-button" type="danger" @click="handleRemoveFile(index)" circle>
                    <el-icon>
                        <Delete />
                    </el-icon>
                </el-button>
            </div>
            <Empty v-if="files.length === 0" description="暂无文件" />
        </div>
        <div class="files-upload-add" v-if="multiple ? files.length < max : files.length <= 0">
            <el-button plain @click="handleAddFile">添加文件</el-button>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { getFileUrl, requestUploadFile } from '@/api';
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import { Delete } from '@element-plus/icons-vue';
import Empty from '../Empty/index.vue';

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
</script>

<style scoped lang="scss">
@use "./index.scss";
</style>