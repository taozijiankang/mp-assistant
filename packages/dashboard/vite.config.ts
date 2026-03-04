import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueDevTools from "vite-plugin-vue-devtools";
import { exec } from "node:child_process";
import vueJsx from "@vitejs/plugin-vue-jsx";
import path from "node:path";
import fs from "node:fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const packageJsonPath = path.join(__dirname, "package.json");
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

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
    __PACKAGE_INFO__: packageJson,
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
