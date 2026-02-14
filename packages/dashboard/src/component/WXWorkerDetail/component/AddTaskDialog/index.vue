<template>
    <el-dialog v-model="visible" title="Add Task" width="80%">
        <el-table :data="selectedWxaList" style="width: 100%">
            <el-table-column label="小程序头像" width="100">
                <template #default="{ row }: { row: WXMPItem }">
                    <img :src="row.app_headimg" alt="app-headimg" style="width: 50px; height: 50px;" />
                </template>
            </el-table-column>
            <el-table-column label="小程序名称">
                <template #default="{ row }: { row: WXMPItem }">
                    <span>{{ row.app_name }}</span>
                </template>
            </el-table-column>
            <el-table-column label="小程序ID">
                <template #default="{ row }: { row: WXMPItem }">
                    <span>{{ row.appid }}</span>
                </template>
            </el-table-column>
            <el-table-column label="小程序原始ID">
                <template #default="{ row }: { row: WXMPItem }">
                    <span>{{ row.username }}</span>
                </template>
            </el-table-column>
        </el-table>
        <el-form :model="form" label-width="120px" :rules="rules">
            <el-form-item label="Type">
                <el-select v-model="form.type">
                    <el-option v-for="item in TaskTypeOptions" :key="item.value" :label="item.label"
                        :value="item.value" />
                </el-select>
            </el-form-item>
            <el-form-item>
                <el-button type="primary" @click="addTask">Add</el-button>
            </el-form-item>
        </el-form>
    </el-dialog>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import { TaskType, TaskTypeOptions } from 'mp-assistant-common/dist/work/task/index.js';
import { requestAddTask } from '@/api/worker';
import { ElMessage } from 'element-plus';
import type { FormRules } from 'element-plus';
import type { WXMPItem } from 'mp-assistant-common/dist/types/wx';
import type { BaseWXTaskParams } from 'mp-assistant-common/dist/work/task/type';

const visible = ref(false);

const loading = ref(false);

const workerKey = ref<string>('');
const selectedWxaList = ref<WXMPItem[]>([]);

const form = ref({
    type: TaskType.WX_INSPECT_VERSION,
});

const rules = ref<FormRules>({
    type: [
        { required: true, message: 'Please select type', trigger: 'change' },
    ],
});

const emit = defineEmits<{
    (e: 'onAddTask'): void;
}>();

const addTask = async () => {
    loading.value = true;
    try {
        for (const wxa of selectedWxaList.value) {
            const params: BaseWXTaskParams = {
                app_name: wxa.app_name,
                username: wxa.username,
            };
            await requestAddTask(workerKey.value, {
                type: form.value.type,
                params,
            });
        }
        visible.value = false;
        ElMessage.success('Add task success');
        emit('onAddTask');
    } catch (error) {
        console.error(error);
        ElMessage.error('Add task failed');
    } finally {
        loading.value = false;
    }
};

const open = (key: string, wxaList: WXMPItem[]) => {
    workerKey.value = key;
    selectedWxaList.value = wxaList;
    visible.value = true;
};

defineExpose({
    open,
});

</script>
<style scoped lang="scss">
@import "./index.scss";
</style>