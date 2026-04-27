<template>
    <div class="wxa-item-card">
        <slot name="prefix" />
        <img class="wxa-icon" :src="wxaItem.app_headimg" alt="小程序头像" />
        <div class="wxa-info">
            <div class="wxa-name-row">
                <div class="wxa-name">
                    <div class="wxa-name-text-wrap" :title="wxaItem.app_name?.trim() || undefined">
                        <span class="wxa-name-text">{{ wxaItem.app_name }}</span>
                    </div>
                </div>
                <div v-if="$slots.extra" class="wxa-extra">
                    <slot name="extra" />
                </div>
            </div>
            <div class="wxa-meta-line wxa-appid">
                <span class="wxa-meta-prefix">appid:</span>
                <span class="wxa-meta-value" :title="wxaItem.appid || undefined">{{ wxaItem.appid }}</span>
                <el-icon v-if="wxaItem.appid" class="copy-icon" @click.stop="handleCopy(wxaItem.appid)">
                    <CopyDocument />
                </el-icon>
            </div>
            <div class="wxa-meta-line wxa-username">
                <span class="wxa-meta-prefix">username:</span>
                <span class="wxa-meta-value" :title="wxaItem.username || undefined">{{ wxaItem.username }}</span>
                <el-icon v-if="wxaItem.username" class="copy-icon" @click.stop="handleCopy(wxaItem.username)">
                    <CopyDocument />
                </el-icon>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { WXMPItem } from '@mp-assistant/common/dist/types/wx';
import { ElMessage } from 'element-plus';
import { CopyDocument } from '@element-plus/icons-vue';

defineProps<{
    wxaItem: WXMPItem;
}>();

const handleCopy = async (text: string) => {
    try {
        await navigator.clipboard.writeText(text);
        ElMessage.success('已复制');
    } catch {
        ElMessage.error('复制失败');
    }
};
</script>

<style scoped lang="scss">
@use "./index.scss";
</style>
