<template>
    <el-dialog v-model="visible" title="标签管理" width="720px" @close="resetState">
        <div class="tag-editor">
            <div class="tag-list">
                <div class="tag-list-header">
                    <span>标签列表</span>
                    <el-button size="small" type="primary" plain @click="addTag">新增标签</el-button>
                </div>
                <div v-if="tags.length === 0" class="tag-list-empty">暂无标签</div>
                <div
                    v-for="(tag, i) in tags"
                    :key="i"
                    class="tag-item"
                    :class="{ active: activeIndex === i }"
                    @click="activeIndex = i"
                >
                    <el-switch :model-value="tag.enabled" size="small" @click.stop @change="val => handleToggle(i, val)" />
                    <span class="tag-name">{{ tag.name || "未命名标签" }}</span>
                    <el-button type="danger" size="small" circle plain @click.stop="removeTag(i)">
                        <el-icon><Delete /></el-icon>
                    </el-button>
                </div>
            </div>
            <div class="tag-detail">
                <template v-if="activeTag">
                    <el-form label-width="60px">
                        <el-form-item label="名称">
                            <el-input v-model="activeTag.name" placeholder="请输入标签名称" />
                        </el-form-item>
                        <el-form-item label="类型">
                            <div class="tag-type">
                                <el-radio-group v-model="activeTag.type">
                                    <el-radio-button value="normal">普通</el-radio-button>
                                    <el-radio-button value="hidden">隐藏</el-radio-button>
                                </el-radio-group>
                                <span class="tag-type-tip">隐藏类型会使其下小程序不在版本视图和总览中显示</span>
                            </div>
                        </el-form-item>
                        <el-form-item v-if="activeTag.type !== 'hidden'" label="颜色">
                            <el-color-picker v-model="activeTag.color" :predefine="PREDEFINE_COLORS" />
                        </el-form-item>
                        <el-form-item label="小程序">
                            <el-select
                                v-model="activeTag.apps"
                                multiple
                                filterable
                                value-key="appid"
                                placeholder="请选择小程序"
                                style="width: 100%"
                            >
                                <el-option v-for="app in appOptions" :key="app.appid" :label="app.appName" :value="app">
                                    <div class="app-option">
                                        <img v-if="app.icon" :src="app.icon" class="app-option-icon" />
                                        <span class="app-option-name">{{ app.appName }}</span>
                                    </div>
                                </el-option>
                            </el-select>
                        </el-form-item>
                    </el-form>
                </template>
                <div v-else class="tag-detail-empty">请选择或新增一个标签</div>
            </div>
        </div>
        <template #footer>
            <el-button @click="visible = false">取消</el-button>
            <el-button type="primary" @click="handleSubmit" :loading="tagStore.saving">保存</el-button>
        </template>
    </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Delete } from "@element-plus/icons-vue";
import type { Tag, TagApp } from "@mp-assistant/common/dist/types/tag.js";
import { isWXWorkerInfo } from "@mp-assistant/common/dist/work/index.js";
import { useTagStore } from "@/stores/tag";
import { useWorkerStore } from "@/stores/worker";

const tagStore = useTagStore();
const workerStore = useWorkerStore();

const PREDEFINE_COLORS = ["#409eff", "#67c23a", "#e6a23c", "#f56c6c", "#909399", "#9c27b0", "#00bcd4", "#ff9800"];

const visible = ref(false);
const tags = ref<Tag[]>([]);
const appOptions = ref<TagApp[]>([]);
const activeIndex = ref(-1);

const activeTag = computed(() => tags.value[activeIndex.value] ?? null);

const resetState = () => {
    tags.value = [];
    appOptions.value = [];
    activeIndex.value = -1;
};

// 聚合所有 WX worker 的小程序，并补充已有标签里的小程序，避免丢失
const buildAppOptions = (): TagApp[] => {
    const map = new Map<string, TagApp>();
    for (const worker of workerStore.workerList ?? []) {
        if (!isWXWorkerInfo(worker)) continue;
        for (const item of worker.wxaList ?? []) {
            map.set(item.appid, { appid: item.appid, appName: item.app_name, icon: item.app_headimg });
        }
    }
    for (const tag of tags.value) {
        for (const app of tag.apps) {
            if (!map.has(app.appid)) map.set(app.appid, app);
        }
    }
    return [...map.values()];
};

const open = () => {
    visible.value = true;
    tags.value = (tagStore.tagList ?? []).map(t => ({ ...t, type: t.type ?? "normal", apps: t.apps.map(a => ({ ...a })) }));
    appOptions.value = buildAppOptions();
    activeIndex.value = tags.value.length ? 0 : -1;
};

const addTag = () => {
    tags.value.push({ name: "", apps: [], enabled: false, color: PREDEFINE_COLORS[0], type: "normal" });
    activeIndex.value = tags.value.length - 1;
};

const removeTag = async (i: number) => {
    const tag = tags.value[i];
    try {
        await ElMessageBox.confirm(`确定删除标签 "${tag?.name || "未命名标签"}" 吗？`, "删除确认", {
            type: "warning"
        });
    } catch {
        return;
    }
    tags.value.splice(i, 1);
    if (activeIndex.value >= tags.value.length) {
        activeIndex.value = tags.value.length - 1;
    }
};

const handleToggle = (i: number, val: string | number | boolean) => {
    tags.value = tags.value.map((t, idx) => (idx === i ? { ...t, enabled: Boolean(val) } : t));
};

const handleSubmit = async () => {
    if (tags.value.some(t => !t.name.trim())) {
        ElMessage.warning("请为所有标签填写名称");
        return;
    }
    try {
        await tagStore.setTags(
            tags.value.map(t => ({
                name: t.name.trim(),
                apps: t.apps.map(a => ({ ...a })),
                enabled: t.enabled,
                color: t.color,
                type: t.type ?? "normal"
            }))
        );
        ElMessage.success("保存成功");
        visible.value = false;
    } catch {
        // 错误已在 request 中处理
    }
};

defineExpose({ open });
</script>

<style scoped lang="scss">
@use "./index.scss";
</style>
