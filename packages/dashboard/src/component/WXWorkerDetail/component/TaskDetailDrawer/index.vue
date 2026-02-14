<template>
    <el-drawer v-model="visible" title="任务详情" :size="400">
        <TaskDetail v-if="taskInfo" :task="taskInfo" />
    </el-drawer>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import TaskDetail from '../TaskDetail/index.vue';
import type { BaseTaskInfo } from 'mp-assistant-common/dist/work/task/type';

const visible = ref(false);

const taskInfo = ref<BaseTaskInfo>();

const emit = defineEmits<{
    (e: 'onClose'): void;
}>();



const open = (taskInfo_val: BaseTaskInfo) => {
    taskInfo.value = taskInfo_val;
    visible.value = true;
};

defineExpose({
    open,
});

</script>
<style scoped lang="scss">
@import "./index.scss";
</style>