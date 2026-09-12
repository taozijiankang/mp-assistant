import type { Component } from "vue";
import "./assets/main.css";
import "element-plus/dist/index.css";
import ElementPlus from 'element-plus';
import zhCn from 'element-plus/es/locale/lang/zh-cn';
import "./styles/index.scss";

import { createApp as createVueApp } from "vue";
import { WSConnection } from "./ws/WSConnection";
import pinia from "./stores";
import router from "./router";
import { useTagStore } from "./stores/tag";
import { useReviewTemplateStore } from "./stores/reviewTemplate";

export async function createApp(App: Component) {
  // 连接 WebSocket
  WSConnection.instance.connect();

  const app = createVueApp(App);
  app.use(ElementPlus, { locale: zhCn });
  app.use(pinia);
  app.use(router);

  // 初始化全局 store：拉取数据并监听内容变更事件
  useTagStore().init();
  useReviewTemplateStore().init();

  await router.isReady();
  return app.mount("#app");
}
