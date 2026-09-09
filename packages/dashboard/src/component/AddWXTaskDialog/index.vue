<template>
    <el-dialog v-model="visible" title="添加任务" width="560px" @close="resetForm">
        <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
            <el-form-item label="类型" prop="type">
                <el-radio-group v-model="form.type">
                    <el-radio-button v-for="opt in WXTaskTypeOptions" :key="opt.value" :value="opt.value">
                        {{ opt.label }}
                    </el-radio-button>
                </el-radio-group>
            </el-form-item>
            <el-form-item label="定时任务">
                <div class="scheduled-wrap">
                    <el-switch v-model="form.scheduled" />
                    <template v-if="form.scheduled">
                        <span class="scheduled-label">间隔</span>
                        <el-input-number v-model="form.interval" :min="1" :step="1" style="width: 140px" />
                        <span class="scheduled-label">秒</span>
                    </template>
                </div>
            </el-form-item>
            <el-divider content-position="left">任务参数</el-divider>
            <el-form-item v-if="form.type === WXTaskType.WX_LOGIN" label="操作" prop="action">
                <el-radio-group v-model="form.action">
                    <el-radio value="login">登录</el-radio>
                    <el-radio value="logout">退出登录</el-radio>
                </el-radio-group>
            </el-form-item>
            <el-form-item v-if="isAppIdRequired" label="小程序" prop="appId">
                <el-select v-model="form.appIds" multiple style="width: 100%" placeholder="请选择小程序" filterable>
                    <el-option v-for="item in wxaList ?? []" :key="item.appid" :label="item.app_name" :value="item.appid">
                        <div class="app-option">
                            <img v-if="item.app_headimg" :src="item.app_headimg" class="app-option-icon" />
                            <span class="app-option-name">{{ item.app_name }}</span>
                        </div>
                    </el-option>
                </el-select>
            </el-form-item>

            <template v-if="isPositionerRequired">
                <el-form-item label="筛选条件" prop="positioners">
                    <div class="positioner-list">
                        <div v-for="(p, i) in form.positioners" :key="i" class="positioner-item">
                            <el-select v-model="p.type" class="positioner-type">
                                <el-option
                                    v-for="opt in VersionPositioningTypeOptions"
                                    :key="opt.value"
                                    :label="opt.label"
                                    :value="opt.value"
                                />
                            </el-select>
                            <el-select v-model="p.criteria" class="positioner-criteria">
                                <el-option
                                    v-for="opt in VersionPositioningCriteriaOptions"
                                    :key="opt.value"
                                    :label="opt.label"
                                    :value="opt.value"
                                />
                            </el-select>
                            <el-input v-model="p.value" placeholder="匹配值" />
                            <el-button type="danger" circle plain @click="form.positioners.splice(i, 1)">
                                <el-icon><Delete /></el-icon>
                            </el-button>
                        </div>
                        <el-button class="positioner-add" plain @click="addPositioner">添加条件</el-button>
                    </div>
                </el-form-item>
            </template>

            <template v-if="form.type === WXTaskType.WX_AUDIT">
                <el-form-item label="审核模板">
                    <div class="template-list">
                        <el-button v-for="(t, i) in templateList" :key="i" size="small" plain @click="fillFromTemplate(t)">
                            {{ t.name }}
                        </el-button>
                        <span v-if="!templateList.length" style="color: var(--el-text-color-secondary); font-size: 12px"
                            >暂无模板</span
                        >
                    </div>
                </el-form-item>

                <el-form-item label="版本描述" prop="versionDescription">
                    <el-input v-model="form.versionDescription" type="textarea" :rows="3" placeholder="请输入版本描述" />
                </el-form-item>

                <el-form-item label="图片预览">
                    <FilesUpload v-model:files="form.imagePreviews" accept="image/*" multiple />
                </el-form-item>

                <el-form-item label="视频预览">
                    <FilesUpload v-model:files="form.videoPreviews" accept="video/*" :max="1" />
                </el-form-item>
            </template>
        </el-form>
        <template #footer>
            <el-button @click="visible = false">取消</el-button>
            <el-button type="primary" @click="handleSubmit" :loading="addLoading">确定</el-button>
        </template>
    </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import { ElMessage } from "element-plus";
import type { FormInstance, FormRules } from "element-plus";
import { Delete } from "@element-plus/icons-vue";
import { requestAddTask } from "@/api";
import { useApiCall } from "@/hooks/useApiCall";
import { WXTaskTypeOptions, WXTaskType } from "@mp-assistant/common/dist/work/const.js";
import type {
    WXLoginTaskOptions,
    WXInspectVersionTaskOptions,
    WXAuditTaskOptions,
    WXPublishTaskOptions
} from "@mp-assistant/common/dist/work/index.js";
import {
    VersionPositioningType,
    VersionPositioningTypeOptions,
    VersionPositioningCriteria,
    VersionPositioningCriteriaOptions
} from "@mp-assistant/common/dist/utils/index.js";
import type { VersionPositioner } from "@mp-assistant/common/dist/utils/index.js";
import type { WXMPItem } from "@mp-assistant/common/dist/types/wx.js";
import type { ReviewTemplate } from "@mp-assistant/common/dist/types/reviewTemplate.js";
import FilesUpload from "@/component/FilesUpload/index.vue";
import { useReviewTemplateStore } from "@/stores/reviewTemplate";

const { call: callAdd, loading: addLoading } = useApiCall(requestAddTask);

const props = defineProps<{
    wxaList?: WXMPItem[];
}>();

const visible = ref(false);
const formRef = ref<FormInstance>();
const currentWorkerKey = ref("");
const reviewTemplateStore = useReviewTemplateStore();
const templateList = computed(() => reviewTemplateStore.reviewTemplateList ?? []);

const form = reactive({
    type: WXTaskType.WX_LOGIN as string,
    action: "login" as "login" | "logout",
    appIds: [] as string[],
    positioners: [] as VersionPositioner[],
    versionDescription: "",
    imagePreviews: [] as string[],
    videoPreviews: [] as string[],
    scheduled: false,
    interval: 60
});

const isAppIdRequired = computed(
    () => form.type === WXTaskType.WX_INSPECT_VERSION || form.type === WXTaskType.WX_AUDIT || form.type === WXTaskType.WX_PUBLISH
);

const isPositionerRequired = computed(() => form.type === WXTaskType.WX_AUDIT || form.type === WXTaskType.WX_PUBLISH);

const rules: FormRules = {
    type: [{ required: true, message: "请选择任务类型", trigger: "change" }],
    appIds: [
        {
            required: true,
            validator: (_rule, _value, callback) => {
                if (isAppIdRequired.value && !form.appIds.length) {
                    callback(new Error("请选择小程序"));
                } else {
                    callback();
                }
            },
            trigger: "change"
        }
    ],
    positioners: [
        {
            required: true,
            validator: (_rule, _value, callback) => {
                if (isPositionerRequired.value && !form.positioners.some(p => p.value.trim())) {
                    callback(new Error("请至少添加一个筛选条件"));
                } else {
                    callback();
                }
            },
            trigger: "change"
        }
    ],
    versionDescription: [
        {
            required: true,
            validator: (_rule, _value, callback) => {
                if (!form.versionDescription.trim()) {
                    callback(new Error("请输入版本描述"));
                } else {
                    callback();
                }
            },
            trigger: "blur"
        }
    ]
};

const resetForm = () => {
    form.type = WXTaskType.WX_LOGIN;
    form.action = "login";
    form.appIds = [];
    form.positioners = [];
    form.versionDescription = "";
    form.imagePreviews = [];
    form.videoPreviews = [];
    form.scheduled = false;
    form.interval = 60;
    currentWorkerKey.value = "";
    formRef.value?.resetFields();
};

const addPositioner = () => {
    form.positioners.push({
        type: VersionPositioningType.Describe,
        criteria: VersionPositioningCriteria.Inclusion,
        value: ""
    });
};

// 从审核模板填充审核内容
const fillFromTemplate = (tpl: ReviewTemplate) => {
    form.versionDescription = tpl.versionDescription;
    form.imagePreviews = [...tpl.imagePreviews];
    form.videoPreviews = tpl.videoPreview ? [tpl.videoPreview] : [];
};

// 过滤掉匹配值为空的条件
const buildPositioners = () => form.positioners.filter(p => p.value.trim());

const buildAuditOptions = (appId: string): WXAuditTaskOptions => {
    const populateData: WXAuditTaskOptions["populateData"] = {
        versionDescription: form.versionDescription.trim()
    };
    if (form.imagePreviews.length) populateData.imagePreviews = form.imagePreviews;
    if (form.videoPreviews[0]) populateData.videoPreview = form.videoPreviews[0];
    return {
        appId,
        positioner: buildPositioners(),
        populateData,
        ...buildScheduledOptions()
    };
};

const buildPublishOptions = (appId: string): WXPublishTaskOptions => {
    return {
        appId,
        positioner: buildPositioners(),
        ...buildScheduledOptions()
    };
};

// 定时任务参数：仅开启定时时携带间隔
const buildScheduledOptions = () => ({
    scheduled: form.scheduled,
    interval: form.scheduled ? form.interval : undefined
});

const handleSubmit = async () => {
    if (!formRef.value) return;
    await formRef.value.validate();
    const type = form.type as WXTaskType;
    try {
        if (type === WXTaskType.WX_LOGIN) {
            // 登录任务不需要指定小程序，单个提交
            await callAdd({
                key: currentWorkerKey.value,
                type,
                options: { action: form.action, ...buildScheduledOptions() } as WXLoginTaskOptions
            });
        } else {
            // 其余类型按选中的小程序逐个调用接口
            for (const appId of form.appIds) {
                let options: WXInspectVersionTaskOptions | WXAuditTaskOptions | WXPublishTaskOptions;
                if (type === WXTaskType.WX_INSPECT_VERSION) {
                    options = { appId, ...buildScheduledOptions() } as WXInspectVersionTaskOptions;
                } else if (type === WXTaskType.WX_AUDIT) {
                    options = buildAuditOptions(appId);
                } else {
                    options = buildPublishOptions(appId);
                }
                await callAdd({ key: currentWorkerKey.value, type, options });
            }
        }
        const count = type === WXTaskType.WX_LOGIN ? 1 : form.appIds.length;
        ElMessage.success(count > 1 ? `已添加 ${count} 个任务` : "添加成功");
        visible.value = false;
    } catch {
        // 错误已在 request 中处理
    }
};

const open = (
    workerKey: string,
    preset?: {
        type?: string;
        appId?: string;
        positioners?: VersionPositioner[];
    }
) => {
    resetForm();
    currentWorkerKey.value = workerKey;
    if (preset?.type) form.type = preset.type;
    if (preset?.appId) form.appIds = [preset.appId];
    if (preset?.positioners) form.positioners = [...preset.positioners];
    visible.value = true;
};

defineExpose({ open });
</script>

<style scoped lang="scss">
@use "./index.scss";
</style>
