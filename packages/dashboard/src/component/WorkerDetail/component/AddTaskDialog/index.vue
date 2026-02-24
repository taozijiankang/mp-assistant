<template>
    <el-dialog v-model="visible" title="添加任务" width="800px">
        <div class="content-container">
            <el-form ref="elFormRef" :model="addTaskForm" label-width="200px" :rules="rules">
                <el-form-item label="任务类型" prop="type">
                    <el-select v-model="addTaskForm.type">
                        <el-option v-for="item in TaskTypeOptions" :key="item.value" :label="item.label"
                            :value="item.value" />
                    </el-select>
                </el-form-item>
                <el-form-item label="AppID" prop="appIds">
                    <el-select v-model="addTaskForm.appIds" multiple filterable default-first-option
                        placeholder="请选择需要添加任务的小程序">
                        <el-option v-for="app in workerDetail?.wxaList || []" :key="app.appid"
                            :label="app.app_name + ' (' + app.appid + ')'" :value="app.appid" />
                    </el-select>
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" :loading="loading" @click="handleAddTask">添加任务</el-button>
                    <el-button @click="visible = false">取消</el-button>
                </el-form-item>
            </el-form>
        </div>
    </el-dialog>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import { requestAddTask, requestGetWorkerDetail } from '@/api';
import { ElMessage } from 'element-plus';
import type { FormRules } from 'element-plus';
import type { ElForm } from 'element-plus';
import type { WXWorkInfo } from 'mp-assistant-common/dist/work/type';
import { TaskType } from 'mp-assistant-common/dist/work/task';
import type { AddTaskForm } from '.';
import { TaskTypeOptions } from 'mp-assistant-common/dist/work/task';
import { isWXWorkerInfo } from 'mp-assistant-common/dist/work';
import type { BaseWXTaskOptions } from 'mp-assistant-common/dist/work/task/type';

const elFormRef = ref<InstanceType<typeof ElForm>>();

const visible = ref(false);

const loading = ref(false);

const workerDetail = ref<WXWorkInfo>();

const getWorkerDetail = async (workerKey: string) => {
    const { data } = await requestGetWorkerDetail(workerKey);
    if (!isWXWorkerInfo(data)) {
        throw new Error('Invalid worker info');
    }
    workerDetail.value = data;
};

const addTaskForm = ref<AddTaskForm>({
    appIds: [],
    type: TaskType.WX_INSPECT_VERSION,
});

const rules = ref<FormRules>({
    type: [
        { required: true, message: 'Please select task type', trigger: 'change' },
    ],
    appIds: [
        { type: 'array', required: true, min: 1, message: 'Please select at least one app', trigger: 'change' },
    ],
});

const handleAddTask = async () => {
    if (!(await elFormRef.value?.validate().catch(() => false))) {
        return;
    }

    loading.value = true;
    try {
        for (const appId of addTaskForm.value.appIds) {
            const appDetail = workerDetail.value?.wxaList.find(app => app.appid === appId);
            const options: BaseWXTaskOptions = {
                app_name: appDetail?.app_name || '',
                username: appDetail?.username || '',
            };
            await requestAddTask(workerDetail.value!.key, {
                type: addTaskForm.value.type,
                options,
            });
        }
        visible.value = false;
        ElMessage.success('Add task success');
    } catch (error) {
        console.error(error);
        ElMessage.error('Add task failed');
    } finally {
        loading.value = false;
    }
};

const open = (workerKey: string) => {
    visible.value = true;

    getWorkerDetail(workerKey);
};

defineExpose({
    open,
});

</script>
<style scoped lang="scss">
@use "./index.scss";
</style>