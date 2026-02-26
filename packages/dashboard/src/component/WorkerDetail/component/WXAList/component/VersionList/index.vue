<template>
    <div class="version-list">
        <template v-if="onlineVersion">
            <span>线上版本</span>
            <div class="version-item-list">
                <div class="version-item">
                    <span>版本：{{ onlineVersion?.version }}</span>
                    <span>发布者: {{ onlineVersion?.nick_name }}</span>
                    <span>备注: {{ onlineVersion?.describe }}</span>
                </div>
            </div>
        </template>
        <template v-if="testVersion">
            <span>审核版本</span>
            <span>{{}}</span>
            <div class="version-item-list">
                <div class="version-item">
                    <span>版本：{{ testVersion?.version }}</span>
                    <span>发布者: {{ testVersion?.nick_name }}</span>
                    <span>备注: {{ testVersion?.describe }}</span>
                </div>
            </div>
        </template>
        <template v-if="devVersions.length > 0">
            <span>开发版本</span>
            <div class="version-item-list">
                <div v-for="item in versionList[WXTaskN.VersionType.DEVELOP]" class="version-item">
                    <span>版本：{{ item?.version }} <span v-if="item.is_exper" style="color: #00ACFF">[体验版本]</span></span>
                    <span>发布者: {{ item?.nick_name }}</span>
                    <span>备注: {{ item?.describe }}</span>
                </div>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { WXTaskN } from 'mp-assistant-common/dist/work/task';
import { computed } from 'vue';

const props = defineProps<{
    versionList: WXTaskN.VersionListData
}>();

const onlineVersion = computed(() => {
    return props.versionList[WXTaskN.VersionType.ONLINE]
});
const testVersion = computed(() => {
    return props.versionList[WXTaskN.VersionType.TEST]
});
const devVersions = computed(() => {
    return props.versionList[WXTaskN.VersionType.DEVELOP] || []
});
</script>

<style scoped lang="scss">
@use "./index.scss";
</style>