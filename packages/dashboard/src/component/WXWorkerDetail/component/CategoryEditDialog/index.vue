<template>
  <el-dialog v-model="visible" title="编辑分组" width="600px" @open="initEdit">
    <div class="cat-dialog">
      <div class="cat-groups">
        <div class="cat-groups-title">分组列表</div>
        <div v-for="(g, i) in categories" :key="i" class="cat-group-item" :class="{ active: i === activeGroupIdx }" @click="activeGroupIdx = i">
          <el-input
            v-if="editingGroupIdx === i"
            v-model="editingGroupName"
            size="small"
            @keyup.enter="finishEditGroup(i)"
            @blur="finishEditGroup(i)"
            @click.stop
          />
          <span v-else @dblclick.stop="startEditGroup(i)">{{ g.name }}</span>
          <el-button size="small" text type="danger" @click.stop="removeGroup(i)">删除</el-button>
        </div>
        <div class="cat-group-add">
          <el-input v-model="newGroupName" size="small" placeholder="新分组名称" @keyup.enter="addGroup" />
          <el-button size="small" @click="addGroup">添加</el-button>
        </div>
      </div>
      <div class="cat-apps">
        <div class="cat-apps-title">{{ activeGroupIdx >= 0 ? categories[activeGroupIdx]?.name + ' 的小程序' : '未分组' }}</div>
        <div v-for="item in currentGroupApps" :key="item.appid" class="cat-app-item">
          <div class="cat-app">
            <img :src="item.app_headimg" class="cat-avatar" />
            <span>{{ item.app_name }}</span>
          </div>
          <el-button size="small" text type="danger" @click="removeApp(activeGroupIdx, item.appid)">移除</el-button>
        </div>
        <div v-if="activeGroupIdx >= 0" class="cat-app-add">
          <el-select v-model="addAppId" size="small" placeholder="添加小程序到该分组" style="flex:1" filterable>
            <el-option v-for="item in unassignedApps" :key="item.appid" :label="item.app_name" :value="item.appid" />
          </el-select>
          <el-button size="small" type="primary" @click="addAppToGroup">添加</el-button>
        </div>
      </div>
    </div>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="handleSave">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import type { WXWorkerInfo, WXWorkerCategory } from "@mp-assistant/common/dist/work/wx/WXWorker.js";
import { requestSetWXCategory } from "@/api";
import { useApiCall } from "@/hooks/useApiCall";

const props = defineProps<{
  modelValue: boolean;
  worker: WXWorkerInfo | null;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
}>();

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit("update:modelValue", v),
});

const categories = ref<WXWorkerCategory[]>([]);
const activeGroupIdx = ref(-1);
const newGroupName = ref("");
const addAppId = ref("");
const editingGroupIdx = ref<number | null>(null);
const editingGroupName = ref("");

const initEdit = () => {
  categories.value = JSON.parse(JSON.stringify(props.worker?.options.categories ?? []));
  activeGroupIdx.value = categories.value.length > 0 ? 0 : -1;
  newGroupName.value = "";
  addAppId.value = "";
  editingGroupIdx.value = null;
};

const startEditGroup = (i: number) => {
  editingGroupIdx.value = i;
  editingGroupName.value = categories.value[i].name;
};

const finishEditGroup = (i: number) => {
  const name = editingGroupName.value.trim();
  if (name && !categories.value.some((g, idx) => idx !== i && g.name === name)) {
    categories.value[i].name = name;
  }
  editingGroupIdx.value = null;
};

const assignedAppIds = computed(() => {
  const ids = new Set<string>();
  for (const g of categories.value) {
    for (const id of g.appIds) ids.add(id);
  }
  return ids;
});

const unassignedApps = computed(() =>
  (props.worker?.wxaList ?? []).filter(item => !assignedAppIds.value.has(item.appid))
);

const currentGroupApps = computed(() => {
  const group = categories.value[activeGroupIdx.value];
  if (!group) return [];
  const ids = new Set(group.appIds);
  return (props.worker?.wxaList ?? []).filter(item => ids.has(item.appid));
});

const addGroup = () => {
  const name = newGroupName.value.trim();
  if (!name || categories.value.some(g => g.name === name)) return;
  categories.value.push({ name, appIds: [] });
  categories.value.sort((a, b) => a.name.localeCompare(b.name));
  newGroupName.value = "";
};

const removeGroup = (i: number) => {
  categories.value.splice(i, 1);
  if (activeGroupIdx.value >= categories.value.length) {
    activeGroupIdx.value = categories.value.length - 1;
  }
};

const addAppToGroup = () => {
  if (!addAppId.value || activeGroupIdx.value < 0) return;
  const group = categories.value[activeGroupIdx.value];
  if (group && !group.appIds.includes(addAppId.value)) {
    group.appIds.push(addAppId.value);
  }
  addAppId.value = "";
};

const removeApp = (groupIdx: number, appId: string) => {
  const group = categories.value[groupIdx];
  if (group) {
    group.appIds = group.appIds.filter(id => id !== appId);
  }
};

const { call: setCatApi } = useApiCall(requestSetWXCategory);

const handleSave = async () => {
  if (!props.worker) return;
  try {
    await setCatApi({ key: props.worker.key, categories: categories.value });
  } catch {}
  visible.value = false;
};
</script>

<style scoped lang="scss">
@use "./index.scss";
</style>
