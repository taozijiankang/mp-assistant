<template>
    <el-dialog v-model="visible" title="添加任务" width="800px">
        <div class="content-container">
            <el-form ref="elFormRef" :model="addTaskForm" label-width="200px" :rules="rules">
                <el-form-item label="任务类型" prop="type">
                    <el-radio-group v-model="addTaskForm.type">
                        <el-radio-button v-for="item in TaskTypeOptions" :key="item.value" :value="item.value">
                            <div class="task-type-container">
                                <img v-if="item.value === TaskType.WX_INSPECT_VERSION"
                                    src="@/assets/check-the-version.png" alt="task-type-icon" class="task-type-icon">
                                <img v-if="item.value === TaskType.WX_AUDIT" src="@/assets/review.png"
                                    alt="task-type-icon" class="task-type-icon">
                                <img v-if="item.value === TaskType.WX_PUBLISH" src="@/assets/release.png"
                                    alt="task-type-icon" class="task-type-icon">
                                {{ item.label }}
                            </div>
                        </el-radio-button>
                    </el-radio-group>
                </el-form-item>
                <el-form-item v-if="!batchMode" label="小程序" prop="appIds">
                    <SelectMp :wxa-list="workerDetail?.wxaList || []" :marked-appid-list="workerDetail?.markWXAppIds"
                        :selectedValue="addTaskForm.appIds" @update:selectedValue="(values) => {
                            addTaskForm.appIds = values;
                        }" />
                </el-form-item>
                <el-form-item v-else label="小程序">
                    <div class="batch-summary">
                        <div class="batch-summary-header">
                            已选
                            <b>{{ batchTotalAppCount }}</b>
                            个小程序，跨
                            <b>{{ batchTargets.length }}</b>
                            个账号
                        </div>
                        <div class="batch-summary-list">
                            <div v-for="target in batchTargets" :key="target.workerKey" class="batch-summary-item">
                                <span class="batch-summary-worker">{{ target.workerName || target.workerKey }}</span>
                                <span class="batch-summary-count">{{ target.appIds.length }} 个</span>
                            </div>
                        </div>
                    </div>
                </el-form-item>
            </el-form>
            <!-- 审核任务表单 -->
            <el-form v-if="addTaskForm.type === TaskType.WX_AUDIT" ref="auditFormRef" :model="auditForm"
                :rules="auditFormRules" label-width="200px">
                <el-form-item label="版本定位条件" prop="positioner">
                    <PositionerEditor v-model="auditForm.positioner"
                        :default-type="VersionPositioningType.Describe" />
                </el-form-item>
                <el-form-item label="版本描述" prop="populateData.versionDescription">
                    <el-input type="textarea" :rows="5" v-model="auditForm.populateData.versionDescription"
                        placeholder="请输入版本描述" />
                </el-form-item>
                <el-form-item label="图片预览" prop="populateData.imagePreview">
                    <FilesUpload :files="auditForm.populateData.imagePreview"
                        @update:files="(files) => auditForm.populateData.imagePreview = files" accept="image/*" multiple
                        :max="10" />
                </el-form-item>
                <el-form-item label="视频预览" prop="populateData.videoPreview">
                    <FilesUpload :files="auditForm.populateData.videoPreview"
                        @update:files="(files) => auditForm.populateData.videoPreview = files" accept="video/*" />
                </el-form-item>
            </el-form>
            <!-- 发布任务表单 -->
            <el-form v-if="addTaskForm.type === TaskType.WX_PUBLISH" ref="publishFormRef" :model="publishForm"
                :rules="publishFormRules" label-width="200px">
                <el-form-item label="发布版本定位条件" prop="positioner">
                    <PositionerEditor v-model="publishForm.positioner"
                        :default-type="VersionPositioningType.NickName" />
                </el-form-item>
            </el-form>
            <el-form label-width="200px">
                <el-form-item>
                    <el-button type="primary" :loading="loading" @click="handleAddTask">添加任务</el-button>
                    <el-button @click="visible = false">取消</el-button>
                </el-form-item>
            </el-form>
        </div>
    </el-dialog>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue';
import { requestAddTask, requestGetWorkerDetail } from '@/api';
import { ElMessage } from 'element-plus';
import type { FormRules } from 'element-plus';
import type { ElForm } from 'element-plus';
import { TaskType, WXTaskN } from '@mp-assistant/common/dist/work/task';
import type { AddTaskForm, AddTaskFormData, AddTaskBatchTarget } from './index';
import { TaskTypeOptions } from '@mp-assistant/common/dist/work/task';
import { WXWorkerN } from '@mp-assistant/common/dist/work';
import type { VersionPositioner } from '@mp-assistant/common/dist/utils/wx';
import { VersionPositioningType } from '@mp-assistant/common/dist/utils/wx';
import FilesUpload from '@/baseComponent/FilesUpload/index.vue';
import SelectMp from '@/baseComponent/SelectMp/index.vue';
import PositionerEditor from './component/PositionerEditor/index.vue';

const elFormRef = ref<InstanceType<typeof ElForm>>();

const auditFormRef = ref<InstanceType<typeof ElForm>>();

const publishFormRef = ref<InstanceType<typeof ElForm>>();

const visible = ref(false);

const loading = ref(false);

const workerDetail = ref<WXWorkerN.WXWorkInfo>();

/** 是否批量模式（跨多个 worker 批量添加） */
const batchMode = ref(false);

/** 批量模式下的目标列表 */
const batchTargets = ref<AddTaskBatchTarget[]>([]);

const batchTotalAppCount = computed(() =>
    batchTargets.value.reduce((sum, t) => sum + t.appIds.length, 0)
);

const getWorkerDetail = async (workerKey: string) => {
    const { data } = await requestGetWorkerDetail(workerKey);
    if (!WXWorkerN.isWXWorkerInfo(data)) {
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
        { required: true, message: '请选择任务类型', trigger: 'change' },
    ],
    appIds: [
        { type: 'array', required: true, min: 1, message: '请选择至少一个小程序', trigger: 'change' },
    ],
});

const auditForm = ref<{
    positioner: VersionPositioner[],
    populateData: {
        versionDescription: string;
        imagePreview: string[];
        videoPreview: string[];
    }
}>({
    positioner: [],
    populateData: {
        versionDescription: '',
        imagePreview: [],
        videoPreview: [],
    },
});

const auditFormRules = ref<FormRules>({
    positioner: [
        {
            required: true,
            validator: (rule, value, callback) => {
                if (value.length === 0) {
                    callback(new Error('请选择至少一个版本定位条件'));
                } else {
                    callback();
                }
            }
        },
    ],
    'populateData.versionDescription': [
        { required: true, message: '请输入版本描述' },
    ]
});

const publishForm = ref<{
    positioner: VersionPositioner[];
}>({
    positioner: [],
});

const publishFormRules = ref<FormRules>({
    positioner: [
        {
            required: true,
            validator: (rule, value, callback) => {
                if (value.length === 0) {
                    callback(new Error('请选择至少一个版本定位条件'));
                } else {
                    callback();

                }
            }
        },
    ],
});

const buildTaskOptions = (appId: string): WXTaskN.TaskOptions => {
    const wxTaskOptions: WXTaskN.TaskOptions = {
        appid: appId,
    };

    if (addTaskForm.value.type === TaskType.WX_AUDIT) {
        return {
            ...wxTaskOptions,
            positioner: auditForm.value.positioner,
            populateData: {
                versionDescription: auditForm.value.populateData.versionDescription,
                imagePreview: auditForm.value.populateData.imagePreview.join(','),
                videoPreview: auditForm.value.populateData.videoPreview.join(','),
            },
        } as WXTaskN.AuditTaskOptions;
    }

    if (addTaskForm.value.type === TaskType.WX_PUBLISH) {
        return {
            ...wxTaskOptions,
            positioner: publishForm.value.positioner,
        } as WXTaskN.ReleaseTaskOptions;
    }

    return wxTaskOptions;
};

const submitTasksForWorker = async (workerKey: string, appIds: string[]) => {
    for (const appId of appIds) {
        const options = buildTaskOptions(appId);

        await requestAddTask(workerKey, {
            type: addTaskForm.value.type,
            options,
        });

        // 如果是发布或者审核任务则多添加一个版本检查任务
        if (
            addTaskForm.value.type === TaskType.WX_AUDIT ||
            addTaskForm.value.type === TaskType.WX_PUBLISH
        ) {
            await requestAddTask(workerKey, {
                type: TaskType.WX_INSPECT_VERSION,
                options: { appid: appId },
            });
        }
    }
};

const handleAddTask = async () => {
    // 校验主表单（非批量模式需要校验 appIds）
    if (!(await elFormRef.value?.validate().catch(() => false))) {
        return;
    }

    // 如果是审核任务，则验证审核任务表单
    if (addTaskForm.value.type === TaskType.WX_AUDIT) {
        if (!(await auditFormRef.value?.validate().catch(() => false))) {
            return;
        }
    }
    // 如果是发布任务，则验证发布任务表单
    else if (addTaskForm.value.type === TaskType.WX_PUBLISH) {
        if (!(await publishFormRef.value?.validate().catch(() => false))) {
            return;
        }
    }

    if (batchMode.value) {
        if (batchTotalAppCount.value === 0) {
            ElMessage.warning('请先在总览中选择小程序');
            return;
        }
    } else if (!workerDetail.value) {
        return;
    }

    loading.value = true;
    try {
        if (batchMode.value) {
            for (const target of batchTargets.value) {
                await submitTasksForWorker(target.workerKey, target.appIds);
            }
        } else {
            await submitTasksForWorker(workerDetail.value!.key, addTaskForm.value.appIds);
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

const applyFormData = (formData?: AddTaskFormData) => {
    const {
        appIds = [],
        type = TaskType.WX_INSPECT_VERSION,
        positioner = [],
        populateData = { versionDescription: '', imagePreview: [], videoPreview: [] },
    } = formData || {};
    addTaskForm.value.appIds = appIds;
    addTaskForm.value.type = type;

    // 审核任务表单
    auditForm.value.positioner = positioner;
    auditForm.value.populateData.versionDescription = populateData.versionDescription || '';
    auditForm.value.populateData.imagePreview = populateData.imagePreview || [];
    auditForm.value.populateData.videoPreview = populateData.videoPreview || [];

    // 发布任务表单
    publishForm.value.positioner = positioner;
};

const open = (workerKey: string, formData?: AddTaskFormData) => {
    batchMode.value = false;
    batchTargets.value = [];
    workerDetail.value = undefined;

    applyFormData(formData);

    visible.value = true;
    getWorkerDetail(workerKey);
};

const openBatch = (targets: AddTaskBatchTarget[], formData?: AddTaskFormData) => {
    batchMode.value = true;
    batchTargets.value = targets.filter(t => t.appIds.length > 0);
    workerDetail.value = undefined;

    applyFormData(formData);
    // 批量模式下 appIds 不参与校验，但仍需赋值以便扁平化展示
    addTaskForm.value.appIds = batchTargets.value.flatMap(t => t.appIds);

    visible.value = true;
};

defineExpose({
    open,
    openBatch,
});

</script>
<style scoped lang="scss">
@use "./index.scss";
</style>