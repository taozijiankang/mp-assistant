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
                <el-form-item label="小程序" prop="appIds">
                    <SelectMp :wxa-list="workerDetail?.wxaList || []" :marked-appid-list="workerDetail?.markWXAppIds"
                        :selectedValue="addTaskForm.appIds" @update:selectedValue="(values) => {
                            addTaskForm.appIds = values;
                        }" />
                </el-form-item>
            </el-form>
            <!-- 审核任务表单 -->
            <el-form v-if="addTaskForm.type === TaskType.WX_AUDIT" ref="auditFormRef" :model="auditForm"
                :rules="auditFormRules" label-width="200px">
                <el-form-item label="版本定位条件" prop="positioner">
                    <div class="positioner-container">
                        <div class="positioner-item" v-for="(item, index) in auditForm.positioner" :key="item.type">
                            <div class="positioner-item-content">
                                <el-select class="select" v-model="item.type" placeholder="请选择版本定位条件">
                                    <el-option v-for="item in VersionPositioningTypeOptions" :key="item.value"
                                        :label="item.label" :value="item.value" />
                                </el-select>
                                <el-select class="select" v-model="item.criteria" placeholder="请选择匹配方式">
                                    <el-option v-for="item in VersionPositioningCriteriaOptions" :key="item.value"
                                        :label="item.label" :value="item.value" />
                                </el-select>
                                <el-input v-if="item.type === VersionPositioningType.Describe" autosize type="textarea"
                                    class="value-input" v-model="item.value" placeholder="请输入版本定位值" clearable />
                                <el-input v-else class="value-input" v-model="item.value" placeholder="请输入版本定位值"
                                    clearable />
                                <el-button type="danger"
                                    @click="handleRemovePositioner(index, TaskType.WX_AUDIT)">删除</el-button>
                            </div>
                            <span v-if="index !== auditForm.positioner.length - 1">AND</span>
                        </div>
                        <Empty v-if="auditForm.positioner.length === 0" description="暂无版本定位条件" />
                        <div class="positioner-add">
                            <el-button plain @click="handleAddPositioner(TaskType.WX_AUDIT)">添加版本定位条件</el-button>
                        </div>
                    </div>
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
                    <div class="positioner-container">
                        <div class="positioner-item" v-for="(item, index) in publishForm.positioner" :key="item.type">
                            <div class="positioner-item-content">
                                <el-select class="select" v-model="item.type" placeholder="请选择版本定位条件">
                                    <el-option v-for="item in VersionPositioningTypeOptions" :key="item.value"
                                        :label="item.label" :value="item.value" />
                                </el-select>
                                <el-select class="select" v-model="item.criteria" placeholder="请选择匹配方式">
                                    <el-option v-for="item in VersionPositioningCriteriaOptions" :key="item.value"
                                        :label="item.label" :value="item.value" />
                                </el-select>
                                <el-input v-if="item.type === VersionPositioningType.Describe" autosize type="textarea"
                                    class="value-input" v-model="item.value" placeholder="请输入版本定位值" clearable />
                                <el-input v-else class="value-input" v-model="item.value" placeholder="请输入版本定位值"
                                    clearable />
                                <el-button type="danger"
                                    @click="handleRemovePositioner(index, TaskType.WX_PUBLISH)">删除</el-button>
                            </div>
                            <span v-if="index !== publishForm.positioner.length - 1">AND</span>
                        </div>
                        <el-empty v-if="publishForm.positioner.length === 0" style="padding: 0" :image-size="80"
                            description="暂无版本定位条件" />
                        <div class="positioner-add">
                            <el-button plain @click="handleAddPositioner(TaskType.WX_PUBLISH)">添加版本定位条件</el-button>
                        </div>
                    </div>
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
import { ref } from 'vue';
import { requestAddTask, requestGetWorkerDetail } from '@/api';
import { ElMessage } from 'element-plus';
import type { FormRules } from 'element-plus';
import type { ElForm } from 'element-plus';
import { TaskType, WXTaskN } from '@mp-assistant/common/dist/work/task';
import type { AddTaskForm, AddTaskFormData } from './index';
import { TaskTypeOptions } from '@mp-assistant/common/dist/work/task';
import { WXWorkerN } from '@mp-assistant/common/dist/work';
import type { VersionPositioner } from '@mp-assistant/common/dist/utils/wx';
import { VersionPositioningCriteria, VersionPositioningCriteriaOptions, VersionPositioningType, VersionPositioningTypeOptions } from '@mp-assistant/common/dist/utils/wx';
import FilesUpload from '@/baseComponent/FilesUpload/index.vue';
import Empty from '@/baseComponent/Empty/index.vue';
import SelectMp from '@/baseComponent/SelectMp/index.vue';

const elFormRef = ref<InstanceType<typeof ElForm>>();

const auditFormRef = ref<InstanceType<typeof ElForm>>();

const publishFormRef = ref<InstanceType<typeof ElForm>>();

const visible = ref(false);

const loading = ref(false);

const workerDetail = ref<WXWorkerN.WXWorkInfo>();

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

const handleAddPositioner = (type: TaskType) => {
    if (type === TaskType.WX_AUDIT) {
        auditForm.value.positioner.push({
            type: VersionPositioningType.Describe,
            criteria: VersionPositioningCriteria.Equal,
            value: '',
        });
    } else if (type === TaskType.WX_PUBLISH) {
        publishForm.value.positioner.push({
            type: VersionPositioningType.NickName,
            criteria: VersionPositioningCriteria.Equal,
            value: '',
        });
    }
};

const handleRemovePositioner = (index: number, type: TaskType) => {
    if (type === TaskType.WX_AUDIT) {
        auditForm.value.positioner.splice(index, 1);
    } else if (type === TaskType.WX_PUBLISH) {
        publishForm.value.positioner.splice(index, 1);
    }
};

const handleAddTask = async () => {
    if (!workerDetail.value) {
        return;
    }

    // 验证任务表单
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

    loading.value = true;
    try {
        for (const appId of addTaskForm.value.appIds) {
            const appDetail = workerDetail.value?.wxaList.find(app => app.appid === appId);

            const wxTaskOptions: WXTaskN.TaskOptions = {
                app_name: appDetail?.app_name || '',
                username: appDetail?.username || '',
            }

            let options: WXTaskN.TaskOptions = {
                ...wxTaskOptions,
            };

            // 如果是审核任务，则添加审核任务选项
            if (addTaskForm.value.type === TaskType.WX_AUDIT) {
                options = {
                    ...options,
                    positioner: auditForm.value.positioner,
                    populateData: {
                        versionDescription: auditForm.value.populateData.versionDescription,
                        imagePreview: auditForm.value.populateData.imagePreview.join(','),
                        videoPreview: auditForm.value.populateData.videoPreview.join(','),
                    },
                } as WXTaskN.AuditTaskOptions;
            }
            // 如果是发布任务，则添加发布任务选项
            else if (addTaskForm.value.type === TaskType.WX_PUBLISH) {
                options = {
                    ...options,
                    positioner: publishForm.value.positioner,
                } as WXTaskN.ReleaseTaskOptions;
            }

            await requestAddTask(workerDetail.value.key, {
                type: addTaskForm.value.type,
                options,
            });

            // 如果是发布或者审核任务则多添加一个版本检查任务
            if (addTaskForm.value.type === TaskType.WX_AUDIT || addTaskForm.value.type === TaskType.WX_PUBLISH) {
                await requestAddTask(workerDetail.value.key, {
                    type: TaskType.WX_INSPECT_VERSION,
                    options: wxTaskOptions
                });
            }
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

const open = (workerKey: string, formData?: AddTaskFormData) => {
    const { appIds = [], type = TaskType.WX_INSPECT_VERSION, positioner = [], populateData = { versionDescription: '', imagePreview: [], videoPreview: [] } } = formData || {};
    addTaskForm.value.appIds = appIds;
    addTaskForm.value.type = type;

    // 审核任务表单
    auditForm.value.positioner = positioner;
    auditForm.value.populateData.versionDescription = populateData.versionDescription || '';
    auditForm.value.populateData.imagePreview = populateData.imagePreview || [];
    auditForm.value.populateData.videoPreview = populateData.videoPreview || [];

    // 发布任务表单
    publishForm.value.positioner = positioner;

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