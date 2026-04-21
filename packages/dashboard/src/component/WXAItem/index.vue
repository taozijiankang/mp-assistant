<template>
    <div class="wxa-item-card">
        <slot name="prefix" />
        <img class="wxa-icon" :src="wxaItem.app_headimg" alt="小程序头像" />
        <div class="wxa-info">
            <div class="wxa-name">
                <span class="wxa-name-text">{{ wxaItem.app_name }}</span>
                <slot name="name-suffix" />
            </div>
            <div class="wxa-appid">appid: {{ wxaItem.appid }}</div>
            <div class="wxa-username">username: {{ wxaItem.username }}</div>
        </div>
        <div v-if="$slots.extra" class="wxa-extra">
            <slot name="extra" />
        </div>
    </div>
</template>

<script setup lang="ts">
import type { WXMPItem } from '@mp-assistant/common/dist/types/wx';

defineProps<{
    wxaItem: WXMPItem;
}>();
</script>

<style scoped lang="scss">
@use "./index.scss";
</style>
