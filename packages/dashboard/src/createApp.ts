import type { Component } from "vue";
import "./assets/main.css";
import "element-plus/dist/index.css";
import ElementPlus from 'element-plus'

import { createApp as createVueApp } from "vue";
import { WSConnection } from "./ws/WSConnection";
import pinia from "./stores";

export async function createApp(App: Component) {
  // 连接 WebSocket
  WSConnection.instance.connect();

  const app = createVueApp(App);
  app.use(ElementPlus);
  app.use(pinia);
  return app.mount("#app");
}
