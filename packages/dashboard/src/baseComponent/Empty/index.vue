<template>
    <div class="empty">
        <span>{{ description }}</span>
    </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
    imageSize?: number;
    description?: string;
}>(), {
    imageSize: 0,
    description: '暂无数据',
});
</script>

<style scoped lang="scss">
@use "./index.scss";
</style>