import type { Component } from "vue";
import "./assets/main.css";
import "element-plus/dist/index.css";
import ElementPlus from 'element-plus'

import { createApp as createVueApp } from "vue";

export function createApp(App: Component) {
  const app = createVueApp(App);
  app.use(ElementPlus);
  return app.mount("#app");
}
