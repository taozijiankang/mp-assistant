import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueDevTools from "vite-plugin-vue-devtools";
import { exec } from "node:child_process";
import vueJsx from "@vitejs/plugin-vue-jsx";

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueJsx(), vueDevTools()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url))
    }
  },
  define: {
    "process.env": {},
    __COMMIT_INFO__: {
      hash: await getGitInfo("%h"),
      author: await getGitInfo("%an"),
      date: await getGitInfo("%cd"),
      title: await getGitInfo("%s"),
      message: await getGitInfo("%b"),
      messageFull: await getGitInfo("%B")
    }
  },
  server: {
    open: false,
    port: 3002,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
      "/ws": {
        target: "ws://localhost:3001",
        ws: true,
      },
    },
  },
});

/**
 * 获取git信息
 */
function getGitInfo(format: string) {
  return new Promise<string>((resolve, reject) => {
    exec(
      `git log -1 HEAD --pretty=format:"${format}"`,
      {
        cwd: process.cwd()
      },
      (error, stdout) => {
        error ? reject(stdout) : resolve(stdout);
      }
    );
  }).catch(() => {
    return "";
  });
}
