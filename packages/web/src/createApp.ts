import type { Component } from "vue";
import "./assets/main.css";
import "element-plus/dist/index.css";

import { createApp as createVueApp } from "vue";

export function createApp(app: Component) {
  return createVueApp(app).mount("#app");
}
