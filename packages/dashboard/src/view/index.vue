<template>
  <div class="app-container">
    <div class="header">
      <div class="header-left">
        <div class="header-title">
          <img src="@/assets/logo.png" alt="小程序助手" class="header-title-logo" />
          <span class="header-title-text">小程序助手 控制台</span>
          <span class="header-title-version">v{{ packageInfo.version }}</span>
        </div>
        <el-menu class="header-menu" mode="horizontal" :default-active="activeMenu" :ellipsis="false"
          @select="handleMenuSelect">
          <el-menu-item v-for="item in menuRoutes" :key="item.path" :index="item.path">
            {{ item.label }}
          </el-menu-item>
        </el-menu>
      </div>
      <el-button type="primary" @click="handleEditConfig" plain :icon="Setting"></el-button>
    </div>
    <router-view v-slot="{ Component }">
      <keep-alive>
        <component :is="Component" />
      </keep-alive>
    </router-view>
    <EditConfigDialog ref="editConfigDialogRef" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import EditConfigDialog from '@/component/EditConfigDialog/index.vue';
import { Setting } from '@element-plus/icons-vue';
import { menuRoutes } from '@/router';

const packageInfo = __PACKAGE_INFO__;
const route = useRoute();
const router = useRouter();

const editConfigDialogRef = ref<InstanceType<typeof EditConfigDialog>>();

const activeMenu = computed(() => route.path);

const handleMenuSelect = (index: string) => {
  if (index !== route.path) {
    router.push(index);
  }
};

const handleEditConfig = () => {
  editConfigDialogRef.value?.open();
};
</script>

<style scoped lang="scss">
@use "./index.scss";
</style>
