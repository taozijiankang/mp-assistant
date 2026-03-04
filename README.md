# 小程序助手（mp-assistant）

用于自动化管理微信小程序版本流程的 Monorepo 工具集，提供：

- 多账号（Worker）统一管理
- 版本检查、批量提审、批量发布
- Web 控制台 + 本地 API + WebSocket 实时状态

## 功能概览

- **微信小程序 Worker 管理**：新增/删除 Worker，维护登录态与小程序列表
- **任务队列执行**：任务按队列自动轮询执行，支持运行过程记录
- **核心任务类型**：
  - 检查版本（`wxnInspectVersion`）
  - 提交审核（`wxnAudit`）
  - 发布版本（`wxnPublish`，支持扫码确认发布）
- **文件能力**：支持上传提审素材（图片/视频），并通过接口回读
- **实时通知**：通过 WebSocket 推送 Worker 列表和详情变化

## 使用方式

### 安装 CLI 包

从 npm 全局安装后即可在任意目录使用 `mp-assistant` 命令：

```bash
# 使用 npm
npm install -g @mp-assistant/cli

# 或使用 pnpm
pnpm add -g @mp-assistant/cli

# 或使用 yarn
yarn global add @mp-assistant/cli
```

不安装也可通过 `npx` 直接运行：

```bash
npx @mp-assistant/cli start
```

### 启动服务

安装完成后，在终端执行：

```bash
mp-assistant start
```

可选参数：

- `-e, --executablePath <path>`：浏览器可执行文件路径
- `-h, --headless <headless>`：是否无头模式（true/false）
- `-p, --port <port>`：服务端口（默认 `3001`）

示例：

```bash
mp-assistant start -e "C:\Program Files\Google\Chrome\Application\chrome.exe" -h false -p 3001
```

> 若在项目本地开发，也可以使用 `node packages/cli/dist/bin/index.js start` 或 `pnpm --filter @mp-assistant/cli dev` 配合构建后运行。

## 技术栈

- **后端/CLI**：Node.js + TypeScript + Fastify + Playwright
- **前端控制台**：Vue 3 + Vite + Element Plus + Pinia
- **构建管理**：pnpm workspace + Turborepo

## 项目结构

```text
packages/
  cli/             # 命令行入口、Fastify 服务、WS 服务
  core/            # Worker 与任务执行核心（Playwright 自动化）
  common/          # 类型定义、API 协议、常量、工具方法
  dashboard/       # Web 控制台（Vue 3）
  scripts/         # 辅助脚本（清理构建产物）
  configuration/   # 共享配置（如 tsconfig.base）
```

## 运行环境要求

- Node.js 18+（建议 20+）
- pnpm 9（项目使用 `pnpm@9.11.0`）
- 可用的 Chromium/Chrome 可执行文件路径（用于 Playwright 持久化上下文）

> 首次使用 Playwright 相关能力时，请确保本机浏览器运行环境完整可用。

## 快速开始

### 1）安装依赖

```bash
pnpm install
```

### 2）构建全部包

```bash
pnpm build
```

### 3）启动服务

```bash
node packages/cli/dist/bin/index.js start
```

可选参数：

- `-e, --executablePath <path>`：浏览器可执行文件路径
- `-h, --headless <headless>`：是否无头模式（true/false）
- `-p, --port <port>`：服务端口（默认 `3001`）

示例：

```bash
node packages/cli/dist/bin/index.js start -e "C:\Program Files\Google\Chrome\Application\chrome.exe" -h false -p 3001
```

启动后访问：

- 控制台：`http://localhost:3001`
- API 前缀：`/api`
- WebSocket：`/ws`

## 使用流程（推荐）

1. 启动服务，进入控制台
2. 在“编辑配置”中确认浏览器路径、端口、headless
3. 新增一个微信小程序 Worker
4. 对 Worker 执行登录，扫码后拉取小程序列表
5. 添加任务（检查版本 / 提审 / 发布）
6. 通过任务运行记录和截图查看执行结果

## 开发命令

### 根目录

- `pnpm dev`：并行启动各包开发任务
- `pnpm build`：构建全部包
- `pnpm clear-build-product`：清理构建产物
- `pnpm commit`：使用 commitizen 提交

### 常用子包

- `pnpm --filter @mp-assistant/cli dev`：CLI 代码 watch 编译
- `pnpm --filter @mp-assistant/dashboard dev`：启动前端开发服务（默认 `3002`）

`dashboard` 开发环境默认使用：

- `VITE_BASE_API_URL="http://localhost:3001"`

对应文件：`packages/dashboard/.env.development`

## 本地数据目录

运行过程中会在 `node_modules` 下生成本地运行数据：

- `.chrome_user_data/`：浏览器持久化上下文（按 Worker 隔离）
- `.store/`：本地配置与 Worker 列表缓存
- `.files/`：上传文件与任务截图等产物

这些目录用于本地状态保持，不建议提交到仓库。

## API 说明（简版）

统一前缀：`/api`

- 配置：`/config`（GET/POST）
- Worker：`/worker-list`、`/worker-add`、`/worker-login`、`/worker-addTask` 等
- 文件：`/upload-file`、`/get-file`

接口定义可参考：`packages/common/src/api/modules/`

## 注意事项

- 发布任务依赖微信侧扫码确认，执行时会生成发布二维码截图
- 若 `executablePath` 配置错误，新增 Worker 会失败
- Worker 登录态失效时，任务会受影响，建议先执行登录与小程序列表刷新

## License

ISC
