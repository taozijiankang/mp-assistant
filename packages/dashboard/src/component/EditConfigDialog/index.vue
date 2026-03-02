<template>
    <el-dialog v-model="visible" title="编辑配置" width="800px">
        <div class="content-container">
            <el-alert title="提示" type="info" show-icon :closable="false">
                修改配置后需要重启小程序助手才能生效
            </el-alert>
            <el-form ref="elFormRef" :model="configForm" label-width="200px" :rules="rules">
                <el-form-item label="浏览器可执行文件路径" prop="executablePath">
                    <el-input v-model="configForm.executablePath" clearable />
                </el-form-item>
                <el-form-item label="是否无头模式">
                    <el-switch v-model="configForm.headless" />
                </el-form-item>
                <el-form-item label="调试端口">
                    <el-input v-model="configForm.port" clearable />
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" :loading="loading" @click="handleSaveConfig">保存配置</el-button>
                    <el-button @click="visible = false">取消</el-button>
                </el-form-item>
            </el-form>
        </div>
    </el-dialog>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import { requestGetConfig, requestSetConfig } from '@/api';
import type { Api } from '@mp-assistant/common/dist/api/index.js';
import { ElMessage } from 'element-plus';
import type { FormRules } from 'element-plus';
import type { ElForm } from 'element-plus';

const elFormRef = ref<InstanceType<typeof ElForm>>();

const visible = ref(false);

const loading = ref(false);

const configForm = ref<Api.Config.GetConfig.ResponseData>({
    executablePath: '',
    headless: false,
    port: 0
});

const rules = ref<FormRules>({
    executablePath: [
        { required: true, message: 'Please input executable path', trigger: 'blur' },
    ]
});

const getConfig = async () => {
    loading.value = true;
    try {
        const { data } = await requestGetConfig();
        configForm.value = data;
    } finally {
        loading.value = false;
    }
};

const handleSaveConfig = async () => {
    if (!(await elFormRef.value?.validate().catch(() => false))) {
        return;
    }

    loading.value = true;
    try {
        const { data } = await requestSetConfig(configForm.value);
        configForm.value = data;
        visible.value = false;
        ElMessage.success('Edit config success');
    } catch (error) {
        console.error(error);
        ElMessage.error('Edit config failed');
    } finally {
        loading.value = false;
    }
};

const open = () => {
    visible.value = true;

    getConfig();
};

defineExpose({
    open,
});

</script>
<style scoped lang="scss">
@use "./index.scss";
</style>