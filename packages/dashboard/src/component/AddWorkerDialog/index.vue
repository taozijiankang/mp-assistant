<template>
    <el-dialog v-model="visible" :title="isEditMode ? '修改 Worker' : '添加 Worker'" width="500px">
        <el-form ref="elFormRef" :model="form" label-width="120px" :rules="rules">
            <el-form-item label="类型" prop="type">
                <el-select v-model="form.type" :disabled="isEditMode">
                    <el-option v-for="item in WorkerTypeOptions" :key="item.value" :label="item.label"
                        :value="item.value" />
                </el-select>
            </el-form-item>
            <el-form-item label="名称" prop="name">
                <el-input v-model="form.name" clearable />
            </el-form-item>
            <el-form-item v-if="isEditMode" label="权重" prop="weight">
                <el-input-number v-model="form.weight" :step="1" :precision="0" controls-position="right" />
                <span class="form-tip">数值越大越靠前</span>
            </el-form-item>
            <el-form-item>
                <el-button type="primary" :loading="submitLoading" @click="handleSubmit">
                    {{ isEditMode ? '修改' : '添加' }}</el-button>
                <el-button @click="visible = false">取消</el-button>
            </el-form-item>
        </el-form>
    </el-dialog>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import { WorkerTypeOptions } from '@mp-assistant/common/dist/work/index.js';
import { requestAddWorker, requestUpdateWorker } from '@/api';
import { WorkerType } from '@mp-assistant/common/dist/work/index.js';
import type { Api } from '@mp-assistant/common/dist/api/index.js';
import { ElMessage } from 'element-plus';
import type { FormRules } from 'element-plus';
import type { ElForm } from 'element-plus';
import { useApiCall } from '@/hooks/useApiCall';
import { getSuccessApiResponse } from '@mp-assistant/common/dist/api/utils';

const elFormRef = ref<InstanceType<typeof ElForm>>();

const visible = ref(false);

const isEditMode = ref(false);
const workerKey = ref('');

const form = ref<Api.Worker.AddWorker.RequestBody & { weight: number }>({
    type: WorkerType.WX,
    name: '',
    weight: 0,
});

const rules = ref<FormRules>({
    name: [
        { required: true, message: 'Please input name', trigger: 'blur' },
    ],
    type: [
        { required: true, message: 'Please select type', trigger: 'change' },
    ],
});

const { loading: submitLoading, call: handleSubmit } = useApiCall(async () => {
    if (!(await elFormRef.value?.validate().catch(() => false))) {
        return getSuccessApiResponse(null);
    }

    if (isEditMode.value) {
        await requestUpdateWorker(workerKey.value, {
            name: form.value.name,
            weight: form.value.weight,
        });
        ElMessage.success('修改 Worker 成功');
    } else {
        await requestAddWorker({ type: form.value.type, name: form.value.name });
        ElMessage.success('添加 Worker 成功');
    }
    visible.value = false;
    return getSuccessApiResponse(null);
});

const open = (editMode = false, key = '', name = '', type = WorkerType.WX, weight = 0) => {
    isEditMode.value = editMode;
    workerKey.value = key;
    form.value = {
        type,
        name,
        weight,
    };
    visible.value = true;
};

defineExpose({
    open,
});

</script>
<style scoped lang="scss">
@use "./index.scss";
</style>