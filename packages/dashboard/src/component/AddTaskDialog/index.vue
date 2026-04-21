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
                <el-form-item label="小程序" prop="targets">
                    <SelectMp v-model="addTaskForm.targets" @update:modelValue="onTargetsChange" />
                </el-form-item>
            </el-form>
            <!-- 审核任务表单 -->
            <el-form v-if="addTaskForm.type === TaskType.WX_AUDIT" ref="auditFormRef" :model="auditForm"
                :rules="auditFormRules" label-width="200px">
                <el-form-item label="版本定位条件" prop="positioner">
                    <PositionerEditor v-model="auditForm.positioner" :default-type="VersionPositioningType.Describe" />
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
import { ref, nextTick } from 'vue';
import { requestAddTask } from '@/api';
import { ElMessage } from 'element-plus';
import type { FormRules } from 'element-plus';
import type { ElForm } from 'element-plus';
import { TaskType, WXTaskN } from '@mp-assistant/common/dist/work/task';
import type { AddTaskFormData, AddTaskBatchTarget, AddTaskDialogOpenOptions } from './index';
import { TaskTypeOptions } from '@mp-assistant/common/dist/work/task';
import type { VersionPositioner } from '@mp-assistant/common/dist/utils/wx';
import { VersionPositioningType } from '@mp-assistant/common/dist/utils/wx';
import FilesUpload from '@/baseComponent/FilesUpload/index.vue';
import SelectMp from '@/component/SelectMp/index.vue';
import PositionerEditor from './component/PositionerEditor/index.vue';

const elFormRef = ref<InstanceType<typeof ElForm>>();

const auditFormRef = ref<InstanceType<typeof ElForm>>();

const publishFormRef = ref<InstanceType<typeof ElForm>>();

const visible = ref(false);

const loading = ref(false);

/** 合并同一 workerKey */
const mergeTargets = (list: AddTaskBatchTarget[]): AddTaskBatchTarget[] => {
    const map = new Map<string, AddTaskBatchTarget>();
    for (const t of list) {
        const key = t.workerKey;
        if (!key) continue;
        if (!map.has(key)) {
            map.set(key, {
                workerKey: key,
                workerName: t.workerName,
                appIds: [...t.appIds],
            });
        } else {
            const ex = map.get(key)!;
            ex.appIds = [...new Set([...ex.appIds, ...t.appIds])];
            if (t.workerName) ex.workerName = t.workerName;
        }
    }
    return Array.from(map.values());
};

const addTaskForm = ref<{
    type: TaskType;
    targets: AddTaskBatchTarget[];
}>({
    type: TaskType.WX_INSPECT_VERSION,
    targets: [],
});

const rules = ref<FormRules>({
    type: [
        { required: true, message: '请选择任务类型', trigger: 'change' },
    ],
    targets: [
        {
            validator: (_rule, value: AddTaskBatchTarget[], callback) => {
                const total = value?.reduce((s, t) => s + t.appIds.length, 0) ?? 0;
                if (total < 1) {
                    callback(new Error('请至少选择一个小程序'));
                } else {
                    callback();
                }
            },
            trigger: 'change',
        },
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

const onTargetsChange = () => {
    nextTick(() => {
        elFormRef.value?.validateField('targets').catch(() => { });
    });
};

const handleAddTask = async () => {
    if (!(await elFormRef.value?.validate().catch(() => false))) {
        return;
    }

    if (addTaskForm.value.type === TaskType.WX_AUDIT) {
        if (!(await auditFormRef.value?.validate().catch(() => false))) {
            return;
        }
    }
    else if (addTaskForm.value.type === TaskType.WX_PUBLISH) {
        if (!(await publishFormRef.value?.validate().catch(() => false))) {
            return;
        }
    }

    const targets = mergeTargets(addTaskForm.value.targets);
    const totalApps = targets.reduce((s, t) => s + t.appIds.length, 0);
    if (totalApps === 0) {
        ElMessage.warning('请至少选择一个小程序');
        return;
    }

    loading.value = true;
    try {
        for (const target of targets) {
            if (target.appIds.length === 0) continue;
            await submitTasksForWorker(target.workerKey, target.appIds);
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
        type = TaskType.WX_INSPECT_VERSION,
        positioner = [],
        populateData = { versionDescription: '', imagePreview: [], videoPreview: [] },
    } = formData || {};
    addTaskForm.value.type = type;

    auditForm.value.positioner = positioner;
    auditForm.value.populateData.versionDescription = populateData.versionDescription || '';
    auditForm.value.populateData.imagePreview = populateData.imagePreview || [];
    auditForm.value.populateData.videoPreview = populateData.videoPreview || [];

    publishForm.value.positioner = positioner;
};

const open = (options: AddTaskDialogOpenOptions) => {
    const { targets, formData } = options;
    applyFormData(formData);

    let merged = mergeTargets(
        (targets || []).map(t => ({
            workerKey: t.workerKey,
            workerName: t.workerName,
            appIds: [...t.appIds],
        }))
    );
    addTaskForm.value.targets = merged;

    visible.value = true;
};

defineExpose({
    open,
});

</script>
<style scoped lang="scss">
@use "./index.scss";
</style>
