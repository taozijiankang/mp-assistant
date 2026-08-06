<template>
  <div v-if="sortedList.length > 0" class="wxa-section">
    <div class="wxa-toolbar">
      <el-input v-model="searchText" placeholder="搜索小程序" clearable size="small" style="width: 180px" />
    </div>
    <div class="wxa-dev-filter">
      <el-checkbox-group v-model="visibleDevs" size="small">
        <el-checkbox v-for="dev in developers" :key="dev.nick_name" :label="dev.nick_name" :value="dev.nick_name" />
      </el-checkbox-group>
      <el-button v-if="visibleDevs.length > 0" size="small" text @click="visibleDevs = []">清除筛选</el-button>
    </div>
    <div class="wxa-table">
      <el-table :data="filteredList" size="small" height="100%" border :cell-style="{ verticalAlign: 'top' }">
      <el-table-column label="小程序" width="200" fixed>
        <template #default="{ row }">
          <div class="wxa-cell">
            <img :src="row.app_headimg" class="wxa-avatar" />
            <span>{{ row.app_name }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="线上版本" width="200">
        <template #default="{ row }">
          <template v-if="row.versionData?.online_info?.basic_info">
            <div class="version-cell">
              <div class="version-tag online">
                <span>{{ row.versionData.online_info.basic_info.nick_name }}</span>
                <span class="vnum">v{{ row.versionData.online_info.basic_info.version }}</span>
              </div>
              <div class="version-desc">{{ row.versionData.online_info.basic_info.describe }}</div>
            </div>
          </template>
          <span v-else class="text-muted">-</span>
        </template>
      </el-table-column>
      <el-table-column label="审核版本" width="200">
        <template #default="{ row }">
          <template v-if="row.versionData?.experience_info?.basic_info">
            <div class="version-cell">
              <div class="version-tag experience">
                <span>{{ row.versionData.experience_info.basic_info.nick_name }}</span>
                <span class="vnum">v{{ row.versionData.experience_info.basic_info.version }}</span>
              </div>
              <div class="version-desc">{{ row.versionData.experience_info.basic_info.describe }}</div>
            </div>
          </template>
          <span v-else class="text-muted">-</span>
        </template>
      </el-table-column>
      <el-table-column v-for="dev in filteredDevelopers" :key="dev.nick_name" :label="dev.nick_name" width="200">
        <template #default="{ row }">
          <template v-if="getDevInfo(row, dev.nick_name)">
            <div class="version-cell">
              <div class="version-tag develop">
                <span class="vnum">v{{ getDevInfo(row, dev.nick_name)!.version }}</span>
              </div>
              <div class="version-desc">{{ getDevInfo(row, dev.nick_name)!.describe }}</div>
            </div>
          </template>
          <span v-else class="text-muted">-</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="80" fixed="right">
        <template #default="{ row }">
          <el-button size="small" text type="primary" @click="$emit('fetchVersion', row.appid)">获取版本</el-button>
        </template>
      </el-table-column>
    </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import fuzzysort from "fuzzysort";
import type { WXWorkerWxaItem } from "@mp-assistant/common/dist/work/wx/WXWorker.js";

const props = defineProps<{
  list?: WXWorkerWxaItem[];
}>();

defineEmits<{
  fetchVersion: [appId: string];
}>();

const searchText = ref("");
const visibleDevs = ref<string[]>([]);

const sortedList = computed(() => [...(props.list ?? [])].sort((a, b) => a.app_name.localeCompare(b.app_name)));

const filteredList = computed(() => {
  if (!searchText.value) return sortedList.value;
  return fuzzysort.go(searchText.value, sortedList.value, { keys: ["app_name", "appid"] }).map(r => r.obj);
});

const developers = computed(() => {
  const set = new Set<string>();
  const list: { nick_name: string }[] = [];
  for (const item of props.list ?? []) {
    for (const dev of item.versionData?.develop_info?.info_list ?? []) {
      if (!set.has(dev.basic_info.nick_name)) {
        set.add(dev.basic_info.nick_name);
        list.push({ nick_name: dev.basic_info.nick_name });
      }
    }
  }
  return list.sort((a, b) => a.nick_name.localeCompare(b.nick_name));
});

const filteredDevelopers = computed(() => {
  if (!visibleDevs.value.length) return developers.value;
  return developers.value.filter(d => visibleDevs.value.includes(d.nick_name));
});

const getDevInfo = (row: WXWorkerWxaItem, nickName: string) => {
  return row.versionData?.develop_info?.info_list?.find(
    d => d.basic_info.nick_name === nickName
  )?.basic_info ?? null;
};
</script>

<style scoped lang="scss">
@use "./index.scss";
</style>
