import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router';

export const menuRoutes: { path: string; label: string }[] = [
  { path: '/', label: '首页' },
];

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/view/home/index.vue'),
    meta: { title: '首页' },
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
