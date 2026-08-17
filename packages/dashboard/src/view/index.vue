<template>
  <div class="app-container">
    <div class="header">
      <div class="header-left">
        <div class="header-title">
          <img src="@/assets/logo.png" alt="小程序助手" class="header-title-logo" />
          <span class="header-title-text">小程序助手 控制台</span>
          <span class="header-title-version">v{{ packageInfo.version }}</span>
        </div>
        <div class="header-menu-group">
          <el-menu class="header-menu" mode="horizontal" :default-active="activeMenu" :ellipsis="false" @select="handleMenuSelect">
            <el-menu-item v-for="item in menuRoutes" :key="item.path" :index="item.path">
              {{ item.label }}
            </el-menu-item>
          </el-menu>
          <el-button size="small" @click="planEditDialog?.open()">计划</el-button>
          <el-button size="small" @click="reviewTemplateEditDialog?.open()">审核模板</el-button>
        </div>
      </div>
    </div>
    <div class="page-content">
      <router-view v-slot="{ Component }">
        <keep-alive>
          <component :is="Component" />
        </keep-alive>
      </router-view>
    </div>
    <PlanEditDialog ref="planEditDialog" />
    <ReviewTemplateEditDialog ref="reviewTemplateEditDialog" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { menuRoutes } from "@/router";
import PlanEditDialog from "@/component/PlanEditDialog/index.vue";
import ReviewTemplateEditDialog from "@/component/ReviewTemplateEditDialog/index.vue";

const packageInfo = __PACKAGE_INFO__;
const route = useRoute();
const router = useRouter();

const activeMenu = computed(() => route.path);

const planEditDialog = ref<InstanceType<typeof PlanEditDialog> | null>(null);
const reviewTemplateEditDialog = ref<InstanceType<typeof ReviewTemplateEditDialog> | null>(null);

const handleMenuSelect = (index: string) => {
  if (index !== route.path) {
    router.push(index);
  }
};
</script>

<style scoped lang="scss">
@use "./index.scss";
</style>
