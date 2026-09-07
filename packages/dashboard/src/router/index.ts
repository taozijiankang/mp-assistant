import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router';

export const menuRoutes: { path: string; label: string }[] = [
  { path: '/', label: '首页' },
  { path: '/wx-overview', label: '微信小程序总览' },
];

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/view/home/index.vue'),
    meta: { title: '首页' },
  },
  {
    path: '/wx-overview',
    name: 'wxOverview',
    component: () => import('@/view/wx-overview/index.vue'),
    meta: { title: '微信小程序总览' },
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
