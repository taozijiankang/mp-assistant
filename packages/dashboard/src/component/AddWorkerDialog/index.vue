<template>
    <el-dialog v-model="visible" title="Add Worker" width="30%">
        <el-form :model="form" label-width="120px" :rules="rules">
            <el-form-item label="Type">
                <el-select v-model="form.type">
                    <el-option v-for="item in WorkerTypeOptions" :key="item.value" :label="item.label"
                        :value="item.value" />
                </el-select>
            </el-form-item>
            <el-form-item label="Name">
                <el-input v-model="form.name" />
            </el-form-item>
            <el-form-item>
                <el-button type="primary" @click="addWorker">Add</el-button>
            </el-form-item>
        </el-form>
    </el-dialog>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import { WorkerTypeOptions } from 'mp-assistant-common/dist/work/index.js';
import { requestAddWorker } from '@/api/worker';
import { WorkerType } from 'mp-assistant-common/dist/work/index.js';
import type { Api } from 'mp-assistant-common/dist/api/index.js';
import { ElMessage } from 'element-plus';
import type { FormRules } from 'element-plus';

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

const emit = defineEmits<{
    (e: 'onAddWorker'): void;
}>();

const addWorker = async () => {
    loading.value = true;
    try {
        await requestAddWorker(form.value);
        visible.value = false;
        ElMessage.success('Add worker success');
        emit('onAddWorker');
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
@import "./index.scss";
</style>