<template>
  <div>
    <h1>小程序助手</h1>
  </div>
</template>

<script setup lang="ts">
import { getConfig } from "../api/config";
import { onMounted } from "vue";

onMounted(async () => {
  try {
    const config = await getConfig();
    console.log(config);
  } catch (error) {
    console.error(error);
  }
});
</script>

<style lang="scss" scoped>
@use "./index.scss";
</style>
