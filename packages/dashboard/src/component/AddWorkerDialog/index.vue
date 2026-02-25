<template>
    <el-dialog v-model="visible" title="添加Worker" width="500px">
        <el-form ref="elFormRef" :model="form" label-width="120px" :rules="rules">
            <el-form-item label="type" prop="type">
                <el-select v-model="form.type">
                    <el-option v-for="item in WorkerTypeOptions" :key="item.value" :label="item.label"
                        :value="item.value" />
                </el-select>
            </el-form-item>
            <el-form-item label="name" prop="name">
                <el-input v-model="form.name" clearable />
            </el-form-item>
            <el-form-item>
                <el-button type="primary" @click="handleAddWorker">添加</el-button>
                <el-button @click="visible = false">取消</el-button>
            </el-form-item>
        </el-form>
    </el-dialog>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import { WorkerTypeOptions } from 'mp-assistant-common/dist/work/index.js';
import { requestAddWorker } from '@/api';
import { WorkerType } from 'mp-assistant-common/dist/work/index.js';
import type { Api } from 'mp-assistant-common/dist/api/index.js';
import { ElMessage } from 'element-plus';
import type { FormRules } from 'element-plus';
import type { ElForm } from 'element-plus';

const elFormRef = ref<InstanceType<typeof ElForm>>();

const visible = ref(false);

const loading = ref(false);

const form = ref<Api.Worker.AddWorker.RequestBody>({
    type: WorkerType.WX,
    name: '',
});

const rules = ref<FormRules>({
    name: [
        { required: true, message: 'Please input name', trigger: 'blur' },
    ],
    type: [
        { required: true, message: 'Please select type', trigger: 'change' },
    ],
});

const handleAddWorker = async () => {
    if (!(await elFormRef.value?.validate().catch(() => false))) {
        return;
    }

    loading.value = true;
    try {
        await requestAddWorker(form.value);
        visible.value = false;
        ElMessage.success('Add worker success');
    } catch (error) {
        console.error(error);
        ElMessage.error('Add worker failed');
    } finally {
        loading.value = false;
    }
};

const open = () => {
    visible.value = true;
};

defineExpose({
    open,
});

</script>
<style scoped lang="scss">
@use "./index.scss";
</style>