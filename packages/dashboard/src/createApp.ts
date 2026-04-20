import type { Component } from "vue";
import "./assets/main.css";
import "element-plus/dist/index.css";
import ElementPlus from 'element-plus';
import "./styles/index.scss";

import { createApp as createVueApp } from "vue";
import { WSConnection } from "./ws/WSConnection";
import pinia from "./stores";
import router from "./router";

export async function createApp(App: Component) {
  // 连接 WebSocket
  WSConnection.instance.connect();

  const app = createVueApp(App);
  app.use(ElementPlus);
  app.use(pinia);
  app.use(router);
  await router.isReady();
  return app.mount("#app");
}
