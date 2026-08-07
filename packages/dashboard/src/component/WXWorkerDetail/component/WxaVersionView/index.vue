<template>
  <div v-if="sortedList.length > 0" class="wxa-section">
    <div class="wxa-toolbar">
      <el-input v-model="searchText" placeholder="搜索小程序" clearable size="small" style="width: 180px" />
      <template v-if="categories.length > 0">
        <el-checkbox-group v-model="visibleCats" size="small">
          <el-checkbox v-for="cat in categories" :key="cat" :label="cat" :value="cat" />
        </el-checkbox-group>
        <el-button v-if="visibleCats.length > 0" size="small" text @click="visibleCats = []">清除</el-button>
      </template>
    </div>
    <div class="wxa-toolbar">
      <el-checkbox-group v-model="visibleDevs" size="small">
        <el-checkbox v-for="dev in developers" :key="dev.nick_name" :label="dev.nick_name" :value="dev.nick_name" />
      </el-checkbox-group>
      <el-button v-if="visibleDevs.length > 0" size="small" text @click="visibleDevs = []">清除</el-button>
    </div>
    <div class="wxa-table">
      <el-table :data="filteredList" size="small" height="100%" border stripe :cell-style="{ verticalAlign: 'top' }">
        <el-table-column :resizable="false" label="小程序" width="200" fixed>
          <template #default="{ row }: { row: WXWorkerWxaItem }">
            <div class="wxa-cell">
              <img :src="row.app_headimg" class="wxa-avatar" />
              <span>{{ row.app_name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column :resizable="false" label="线上版本" width="200">
          <template #default="{ row }: { row: WXWorkerWxaItem }">
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
        <el-table-column :resizable="false" label="审核版本" width="200">
          <template #default="{ row }: { row: WXWorkerWxaItem }">
            <template v-if="row.versionData?.experience_info?.basic_info?.audit_status !== undefined">
              <div class="version-cell">
                <div class="version-tag experience" :class="`audit-${row.versionData.experience_info.basic_info.audit_status}`">
                  <span>{{ row.versionData.experience_info.basic_info.nick_name }}</span>
                  <span class="vnum">v{{ row.versionData.experience_info.basic_info.version }}</span>
                </div>
                <div class="version-status" :class="`audit-${row.versionData.experience_info.basic_info.audit_status}`">
                  <template v-if="row.versionData.experience_info.basic_info.audit_status === WXAuditStatus.FAIL">
                    <el-popover placement="top" :width="300" trigger="hover">
                      <template #reference>
                        <span>{{ WXAuditStatusDict[WXAuditStatus.FAIL] }}</span>
                      </template>
                      <div class="audit-fail-detail">
                        <div v-if="row.versionData.experience_info.basic_info.fail_reason" class="audit-fail-block">
                          <div class="audit-fail-label">失败原因</div>
                          <div class="audit-fail-text">{{ row.versionData.experience_info.basic_info.fail_reason }}</div>
                        </div>
                        <div v-if="row.versionData.experience_info.basic_info.reject_reason" class="audit-fail-block">
                          <div class="audit-fail-label">驳回理由</div>
                          <div class="audit-fail-text">{{ row.versionData.experience_info.basic_info.reject_reason }}</div>
                        </div>
                      </div>
                    </el-popover>
                  </template>
                  <template v-else>
                    {{ WXAuditStatusDict[row.versionData.experience_info.basic_info.audit_status as WXAuditStatus] }}
                  </template>
                </div>
                <div class="version-desc">{{ row.versionData.experience_info.basic_info.describe }}</div>
              </div>
            </template>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column
          :resizable="false"
          v-for="dev in filteredDevelopers"
          :key="dev.nick_name"
          :label="dev.nick_name"
          width="200"
        >
          <template #default="{ row }: { row: WXWorkerWxaItem }">
            <template v-if="getDevInfo(row, dev.nick_name)">
              <div class="version-cell">
                <div class="version-tag develop">
                  <span class="vnum">v{{ getDevInfo(row, dev.nick_name)!.version }}</span>
                  <span v-if="isDevReleased(row, dev.nick_name)" class="released-tag">已上线</span>
                  <span v-else-if="isDevAuditing(row, dev.nick_name)" class="audit-tag" :class="`audit-${row.versionData!.experience_info!.basic_info!.audit_status}`">
                    {{ devAuditLabel(row) }}
                  </span>
                </div>
                <div class="version-desc">{{ getDevInfo(row, dev.nick_name)!.describe }}</div>
              </div>
            </template>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column :resizable="false" label="操作" width="120" fixed="right">
          <template #default="{ row }: { row: WXWorkerWxaItem }">
            <template v-if="hasTask(row, WXTaskType.WX_INSPECT_VERSION)">
              <el-button
                size="small"
                text
                type="warning"
                @click="$emit('showTask', hasTask(row, WXTaskType.WX_INSPECT_VERSION)!.key)"
              >
                {{ WXTaskTypeDict[WXTaskType.WX_INSPECT_VERSION] }}进行中
              </el-button>
            </template>
            <el-button v-else size="small" text type="primary" @click="$emit('fetchVersion', row.appid)">获取版本</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import fuzzysort from "fuzzysort";
import { TaskStatus, WXTaskType, WXTaskTypeDict } from "@mp-assistant/common/dist/work/const.js";
import { WXAuditStatus, WXAuditStatusDict } from "@mp-assistant/common/dist/constant/wx.js";
import type { WXWorkerWxaItem } from "@mp-assistant/common/dist/work/wx/WXWorker.js";

const props = defineProps<{
  list?: WXWorkerWxaItem[];
}>();

defineEmits<{
  fetchVersion: [appId: string];
  showTask: [taskKey: string];
}>();

const searchText = ref("");
const visibleDevs = ref<string[]>([]);
const visibleCats = ref<string[]>([]);

const sortedList = computed(() => [...(props.list ?? [])].sort((a, b) => a.app_name.localeCompare(b.app_name)));

const filteredList = computed(() => {
  let list = sortedList.value;
  if (searchText.value) {
    list = fuzzysort.go(searchText.value, list, { keys: ["app_name", "appid"] }).map(r => r.obj);
  }
  if (visibleCats.value.length) {
    list = list.filter(item => item.category && visibleCats.value.includes(item.category));
  }
  return list;
});

const categories = computed(() => {
  const set = new Set<string>();
  for (const item of props.list ?? []) {
    if (item.category) set.add(item.category);
  }
  return [...set].sort();
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

const hasTask = (row: WXWorkerWxaItem, type: WXTaskType) => {
  return row.tasks?.find(t => (t.status === TaskStatus.RUNNING || t.status === TaskStatus.IDLE) && t.type === type) ?? null;
};

const isDevReleased = (row: WXWorkerWxaItem, nickName: string) => {
  const online = row.versionData?.online_info?.basic_info;
  const dev = getDevInfo(row, nickName);
  if (!online || !dev) return false;
  return online.nick_name === dev.nick_name && online.version === dev.version && online.describe === dev.describe;
};

const isDevAuditing = (row: WXWorkerWxaItem, nickName: string) => {
  const exp = row.versionData?.experience_info?.basic_info;
  const dev = getDevInfo(row, nickName);
  if (!exp || !dev || exp.audit_status === undefined) return false;
  return exp.nick_name === dev.nick_name && exp.version === dev.version && exp.describe === dev.describe;
};

const devAuditLabel = (row: WXWorkerWxaItem) => {
  const status = row.versionData?.experience_info?.basic_info?.audit_status;
  if (status === WXAuditStatus.REVIEWING) return '待审核';
  if (status === WXAuditStatus.SUCCESS) return '待发布';
  if (status === WXAuditStatus.FAIL) return '审核失败';
  return '';
};

const getDevInfo = (row: WXWorkerWxaItem, nickName: string) => {
  return row.versionData?.develop_info?.info_list?.find(d => d.basic_info.nick_name === nickName)?.basic_info ?? null;
};
</script>

<style scoped lang="scss">
@use "./index.scss";
</style>
