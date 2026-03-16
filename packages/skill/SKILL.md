---
name: mp-assistant
description: |
  使用此 skill 与 mp-assistant server 交互，管理微信小程序的自动化操作。
  mp-assistant 是一个可部署在任意位置的服务，提供 HTTP API，支持：
  - 创建和管理 Worker（每个 Worker 对应一个微信账号）
  - Worker 登录/登出（扫码登录）
  - 获取账号下的小程序列表
  - 对小程序执行任务：检查版本、提交审核、发布上线
  - 实时查询任务执行状态和结果
  当用户需要查看小程序版本、批量提审、批量发布，或管理多个微信账号时，使用此 skill。
---

## 服务地址策略

1. 优先尝试 `http://localhost:3001`
2. 若连接失败，询问用户实际服务地址

所有接口路径前缀为 `/api`，完整示例：`http://localhost:3001/api/worker-list`

---

## 统一响应格式

```json
{
  "code": 200,
  "message": "ok",
  "data": <ResponseData>
}
```

错误时 `code` 为 400 / 401 / 403 / 404 / 500，`data` 为 null。

---

## 枚举值速查

**WorkerType**
| 值 | 含义 |
|---|---|
| `wx` | 微信小程序 |

**WorkerStatus**
| 值 | 含义 |
|---|---|
| `running` | 运行中 |
| `paused` | 已暂停 |
| `deleted` | 已删除 |

**TaskType**
| 值 | 含义 |
|---|---|
| `wxnInspectVersion` | 检查小程序版本 |
| `wxnAudit` | 提交审核 |
| `wxnPublish` | 发布上线 |

**TaskStatus**
| 值 | 含义 |
|---|---|
| `notStarted` | 未开始 |
| `running` | 执行中 |
| `completed` | 完成 |
| `failed` | 失败 |

**VersionPositioningType**（positioner.type）
| 值 | 含义 |
|---|---|
| `describe` | 备注 |
| `nick_name` | 发布者 |
| `version` | 版本号 |

**VersionPositioningCriteria**（positioner.criteria）
| 值 | 含义 |
|---|---|
| `Equal` | 等于 |
| `Inclusion` | 包含 |

---

## API 索引

| 接口 | 方法 | 用途 | 详情 |
|---|---|---|---|
| `/api/config` | GET | 获取服务配置 | [ref-config.md](./ref-config.md) |
| `/api/config` | POST | 更新服务配置 | [ref-config.md](./ref-config.md) |
| `/api/upload-file` | POST | 上传文件到服务端 | [ref-file.md](./ref-file.md) |
| `/api/get-file` | GET | 从服务端下载文件 | [ref-file.md](./ref-file.md) |
| `/api/worker-list` | GET | 获取所有 Worker | [ref-worker.md](./ref-worker.md) |
| `/api/worker-detail` | GET | 获取单个 Worker 详情 | [ref-worker.md](./ref-worker.md) |
| `/api/worker-add` | POST | 创建 Worker | [ref-worker.md](./ref-worker.md) |
| `/api/worker-remove` | DELETE | 删除 Worker | [ref-worker.md](./ref-worker.md) |
| `/api/worker-update` | PUT | 修改 Worker 名称 | [ref-worker.md](./ref-worker.md) |
| `/api/worker-pauseAndRecover` | POST | 暂停/恢复 Worker | [ref-worker.md](./ref-worker.md) |
| `/api/worker-login` | POST | 触发扫码登录 | [ref-worker.md](./ref-worker.md) |
| `/api/worker-logout` | POST | 登出 | [ref-worker.md](./ref-worker.md) |
| `/api/worker-updateWxaList` | GET | 刷新小程序列表 | [ref-worker.md](./ref-worker.md) |
| `/api/worker-markWXAppId` | POST | 标记/取消标记小程序 | [ref-worker.md](./ref-worker.md) |
| `/api/worker-addTask` | POST | 添加任务 | [ref-task.md](./ref-task.md) |
| `/api/worker-removeTask` | DELETE | 删除任务 | [ref-task.md](./ref-task.md) |
| `/api/worker-taskDetail` | GET | 查询任务详情 | [ref-task.md](./ref-task.md) |
| `/api/worker-getPublishQRCode` | POST | 触发生成发布二维码 | [ref-task.md](./ref-task.md) |

---

## 典型工作流

### 查看小程序版本
1. `GET /api/worker-list` 获取可用 Worker
2. 选择已登录的 Worker（`isLogin: true`）
3. `POST /api/worker-addTask?key=<workerKey>` 添加 `wxnInspectVersion` 任务
4. 轮询 `GET /api/worker-taskDetail?key=&taskKey=` 直到 status 为 `completed`
5. 读取 `result.data` 展示版本信息

### 批量提审
1. 确认 Worker 已登录，获取 `wxaList` 中目标小程序
2. 为每个小程序添加 `wxnAudit` 任务（可指定 `positioner` 筛选版本）
3. 轮询各任务状态，汇总结果

### 扫码登录
1. `POST /api/worker-login?key=<workerKey>` 触发登录
2. 轮询 `GET /api/worker-detail?key=<workerKey>`
3. 当 `loginQRCodeFilePath` 非空时，用 `GET /api/get-file?filePath=` 下载二维码图片展示给用户
4. 用户扫码后继续轮询直到 `isLogin: true`
