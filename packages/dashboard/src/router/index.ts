import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router';

export const menuRoutes: { path: string; label: string }[] = [
  { path: '/', label: '首页' },
  { path: '/overview', label: '小程序总览' },
];

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/view/Home/index.vue'),
    meta: { title: '首页' },
  },
  {
    path: '/overview',
    name: 'overview',
    component: () => import('@/view/Overview/index.vue'),
    meta: { title: '小程序总览' },
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
