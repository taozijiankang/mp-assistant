<template>
  <el-dialog v-model="visible" title="计划管理" width="720px" @close="resetState">
    <div class="plan-editor">
      <div class="plan-list">
        <div class="plan-list-header">
          <span>计划列表</span>
          <el-button size="small" type="primary" plain @click="addPlan">新增计划</el-button>
        </div>
        <div v-if="plans.length === 0" class="plan-list-empty">暂无计划</div>
        <div
          v-for="(plan, i) in plans"
          :key="i"
          class="plan-item"
          :class="{ active: activeIndex === i }"
          @click="activeIndex = i"
        >
          <el-switch
            :model-value="plan.enabled"
            size="small"
            @click.stop
            @change="(val) => handleToggle(i, val)"
          />
          <span class="plan-name">{{ plan.name || "未命名计划" }}</span>
          <el-button type="danger" size="small" circle plain @click.stop="removePlan(i)">
            <el-icon><Delete /></el-icon>
          </el-button>
        </div>
      </div>
      <div class="plan-detail">
        <template v-if="activePlan">
          <el-form label-width="60px">
            <el-form-item label="名称">
              <el-input v-model="activePlan.name" placeholder="请输入计划名称" />
            </el-form-item>
            <el-form-item label="小程序">
              <el-select
                v-model="activePlan.apps"
                multiple
                filterable
                value-key="appid"
                placeholder="请选择小程序"
                style="width: 100%"
              >
                <el-option v-for="app in appOptions" :key="app.appid" :label="app.appName" :value="app">
                  <div class="app-option">
                    <img v-if="app.icon" :src="app.icon" class="app-option-icon" />
                    <span class="app-option-name">{{ app.appName }}</span>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>
          </el-form>
        </template>
        <div v-else class="plan-detail-empty">请选择或新增一个计划</div>
      </div>
    </div>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="handleSubmit" :loading="planStore.saving">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Delete } from "@element-plus/icons-vue";
import type { Plan, PlanApp } from "@mp-assistant/common/dist/types/plan.js";
import { isWXWorkerInfo } from "@mp-assistant/common/dist/work/index.js";
import { usePlanStore } from "@/stores/plan";
import { useWorkerStore } from "@/stores/worker";

const planStore = usePlanStore();
const workerStore = useWorkerStore();

const visible = ref(false);
const plans = ref<Plan[]>([]);
const appOptions = ref<PlanApp[]>([]);
const activeIndex = ref(-1);

const activePlan = computed(() => plans.value[activeIndex.value] ?? null);

const resetState = () => {
  plans.value = [];
  appOptions.value = [];
  activeIndex.value = -1;
};

// 聚合所有 WX worker 的小程序，并补充已有计划里的小程序，避免丢失
const buildAppOptions = (): PlanApp[] => {
  const map = new Map<string, PlanApp>();
  for (const worker of workerStore.workerList ?? []) {
    if (!isWXWorkerInfo(worker)) continue;
    for (const item of worker.wxaList ?? []) {
      map.set(item.appid, { appid: item.appid, appName: item.app_name, icon: item.app_headimg });
    }
  }
  for (const plan of plans.value) {
    for (const app of plan.apps) {
      if (!map.has(app.appid)) map.set(app.appid, app);
    }
  }
  return [...map.values()];
};

const open = () => {
  visible.value = true;
  plans.value = (planStore.planList ?? []).map(p => ({ ...p, apps: p.apps.map(a => ({ ...a })) }));
  appOptions.value = buildAppOptions();
  activeIndex.value = plans.value.length ? 0 : -1;
};

const addPlan = () => {
  plans.value.push({ name: "", apps: [], enabled: false });
  activeIndex.value = plans.value.length - 1;
};

const removePlan = async (i: number) => {
  const plan = plans.value[i];
  try {
    await ElMessageBox.confirm(`确定删除计划 "${plan?.name || "未命名计划"}" 吗？`, "删除确认", {
      type: "warning"
    });
  } catch {
    return;
  }
  plans.value.splice(i, 1);
  if (activeIndex.value >= plans.value.length) {
    activeIndex.value = plans.value.length - 1;
  }
};

const handleToggle = (i: number, val: string | number | boolean) => {
  plans.value = plans.value.map((p, idx) => (idx === i ? { ...p, enabled: Boolean(val) } : p));
};

const handleSubmit = async () => {
  if (plans.value.some(p => !p.name.trim())) {
    ElMessage.warning("请为所有计划填写名称");
    return;
  }
  try {
    await planStore.setPlans(
      plans.value.map(p => ({ name: p.name.trim(), apps: p.apps.map(a => ({ ...a })), enabled: p.enabled }))
    );
    ElMessage.success("保存成功");
    visible.value = false;
  } catch {
    // 错误已在 request 中处理
  }
};

defineExpose({ open });
</script>

<style scoped lang="scss">
@use "./index.scss";
</style>
