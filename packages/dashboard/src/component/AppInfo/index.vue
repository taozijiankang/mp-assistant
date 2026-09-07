<template>
  <div class="app-info">
    <img :src="avatar" class="avatar" />
    <div class="body">
      <div class="name">{{ appName }}</div>
      <div v-if="tags.length" class="tags">
        <span v-for="tag in tags" :key="tag.name" class="tag" :style="tagStyle(tag.color)">
          {{ tag.name }}
        </span>
      </div>
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useTagStore } from "@/stores/tag";

const props = defineProps<{
  appid: string;
  appName: string;
  avatar: string;
}>();

const tagStore = useTagStore();
const tags = computed(() => tagStore.appTags[props.appid] ?? []);

const DEFAULT_TAG_COLOR = "#409eff";

/** 标签颜色：文字用原色，背景用带透明度的同色 */
const tagStyle = (color?: string) => {
  const c = color || DEFAULT_TAG_COLOR;
  return { color: c, backgroundColor: hexToRgba(c, 0.12) };
};

const hexToRgba = (hex: string, alpha: number) => {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map(ch => ch + ch).join("") : h;
  const num = parseInt(full, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};
</script>

<style scoped lang="scss">
@use "./index.scss";
</style>
