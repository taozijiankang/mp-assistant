<template>
    <div class="positioner-editor">
        <div class="editor-tip">以下条件需同时满足（AND）</div>
        <template v-if="modelValue.length > 0">
            <template v-for="(item, index) in modelValue" :key="index">
                <div class="positioner-card">
                    <div class="card-fields">
                        <el-select class="field-type" v-model="item.type" placeholder="字段">
                            <el-option v-for="opt in VersionPositioningTypeOptions" :key="opt.value"
                                :label="opt.label" :value="opt.value" />
                        </el-select>
                        <el-select class="field-criteria" v-model="item.criteria" placeholder="匹配">
                            <el-option v-for="opt in VersionPositioningCriteriaOptions" :key="opt.value"
                                :label="opt.label" :value="opt.value" />
                        </el-select>
                        <el-input v-if="item.type === VersionPositioningType.Describe" class="field-value" autosize
                            type="textarea" v-model="item.value" placeholder="请输入匹配值" clearable />
                        <el-input v-else class="field-value" v-model="item.value" placeholder="请输入匹配值"
                            clearable />
                    </div>
                    <el-tooltip content="删除条件" placement="top">
                        <el-icon class="remove-icon" @click="handleRemove(index)">
                            <Delete />
                        </el-icon>
                    </el-tooltip>
                </div>
                <div v-if="index < modelValue.length - 1" class="and-divider">
                    <span class="line"></span>
                    <span class="and-badge">AND</span>
                    <span class="line"></span>
                </div>
            </template>
        </template>
        <div v-else class="empty-hint">暂无条件，点击下方按钮添加</div>
        <el-button class="add-btn" plain @click="handleAdd">
            <el-icon>
                <Plus />
            </el-icon>
            <span>添加版本定位条件</span>
        </el-button>
    </div>
</template>

<script setup lang="ts">
import { Delete, Plus } from '@element-plus/icons-vue';
import {
    VersionPositioningCriteria,
    VersionPositioningCriteriaOptions,
    VersionPositioningType,
    VersionPositioningTypeOptions,
    type VersionPositioner,
} from '@mp-assistant/common/dist/utils/wx';

const props = defineProps<{
    modelValue: VersionPositioner[];
    /** 新增一条时的默认字段类型 */
    defaultType?: VersionPositioningType;
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: VersionPositioner[]): void;
}>();

const handleAdd = () => {
    const next: VersionPositioner = {
        type: props.defaultType ?? VersionPositioningType.Describe,
        criteria: VersionPositioningCriteria.Equal,
        value: '',
    };
    emit('update:modelValue', [...props.modelValue, next]);
};

const handleRemove = (index: number) => {
    const next = props.modelValue.slice();
    next.splice(index, 1);
    emit('update:modelValue', next);
};
</script>

<style scoped lang="scss">
@use "./index.scss";
</style>
