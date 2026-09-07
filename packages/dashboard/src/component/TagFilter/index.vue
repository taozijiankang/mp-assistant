<template>
    <el-select
        v-model="selected"
        multiple
        collapse-tags
        collapse-tags-tooltip
        clearable
        size="small"
        placeholder="按标签筛选"
        class="tag-filter"
    >
        <el-option v-for="tag in enabledTags" :key="tag.name" :label="tag.name" :value="tag.name">
            <span class="tag-option">
                <span class="dot" :style="{ background: tag.color || DEFAULT_TAG_COLOR }"></span>
                <span class="name">{{ tag.name }}</span>
            </span>
        </el-option>
    </el-select>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useTagStore } from "@/stores/tag";

const props = defineProps<{ modelValue: string[] }>();
const emit = defineEmits<{ "update:modelValue": [value: string[]] }>();

const DEFAULT_TAG_COLOR = "#409eff";

const tagStore = useTagStore();
const enabledTags = computed(() => (tagStore.tagList ?? []).filter(t => t.enabled && t.type !== "hidden"));

const selected = computed({
    get: () => props.modelValue,
    set: (value: string[]) => emit("update:modelValue", value ?? [])
});
</script>

<style scoped lang="scss">
@use "./index.scss";
</style>
