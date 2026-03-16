# Worker API

## WXWorkInfo 数据结构

```ts
interface WXWorkInfo {
  key: string;              // Worker 唯一标识
  name: string;             // Worker 名称
  type: "wx";               // Worker 类型，目前只有 wx
  status: WorkerStatus;     // "running" | "paused" | "deleted"
  loadings: string[];       // 当前正在执行的操作标识列表
  taskList: BaseTaskInfo[]; // 任务列表（见 ref-task.md）
  isLogin: boolean;         // 是否已登录
  loginQRCodeFilePath: string; // 登录二维码服务端路径（登录流程中使用）
  wxaList: WXMPItem[];      // 小程序列表
  markWXAppIds: string[];   // 已标记的小程序 appId 列表
}

interface WXMPItem {
  appid: string;
  nick_name: string;        // 小程序名称
  // 其他微信平台返回的字段
}
```

`loadings` 常见值：`"login"` / `"logout"` / `"updateWxaListWxaList"`

---

## GET /api/worker-list

获取所有 Worker 列表。

**Response data** — `WXWorkInfo[]`

```bash
curl http://localhost:3001/api/worker-list
```

---

## GET /api/worker-detail?key=

获取单个 Worker 详情。

**Query 参数**

| 参数 | 类型 | 说明 |
|---|---|---|
| `key` | string | Worker key |

**Response data** — `WXWorkInfo`

```bash
curl "http://localhost:3001/api/worker-detail?key=worker_abc"
```

---

## POST /api/worker-add

创建新 Worker。

**Request body**
```json
{
  "type": "wx",
  "name": "账号A"
}
```

**Response data** — `WXWorkInfo`（新创建的 Worker）

```bash
curl -X POST http://localhost:3001/api/worker-add \
  -H "Content-Type: application/json" \
  -d '{"type": "wx", "name": "账号A"}'
```

---

## DELETE /api/worker-remove?key=

删除 Worker。

**Query 参数**

| 参数 | 类型 | 说明 |
|---|---|---|
| `key` | string | Worker key |

**Response data** — `null`

```bash
curl -X DELETE "http://localhost:3001/api/worker-remove?key=worker_abc"
```

---

## PUT /api/worker-update?key=

修改 Worker 名称。

**Query 参数**

| 参数 | 类型 | 说明 |
|---|---|---|
| `key` | string | Worker key |

**Request body**
```json
{
  "name": "新名称"
}
```

**Response data** — `WXWorkInfo`（更新后）

```bash
curl -X PUT "http://localhost:3001/api/worker-update?key=worker_abc" \
  -H "Content-Type: application/json" \
  -d '{"name": "新名称"}'
```

---

## POST /api/worker-pauseAndRecover?key=

暂停或恢复 Worker（切换状态）。

**Query 参数**

| 参数 | 类型 | 说明 |
|---|---|---|
| `key` | string | Worker key |

**Response data** — `null`

```bash
curl -X POST "http://localhost:3001/api/worker-pauseAndRecover?key=worker_abc"
```

---

## POST /api/worker-login?key=

触发扫码登录流程。调用后轮询 `worker-detail`，当 `loginQRCodeFilePath` 非空时用 `GET /api/get-file` 下载二维码展示给用户，直到 `isLogin: true`。

**Query 参数**

| 参数 | 类型 | 说明 |
|---|---|---|
| `key` | string | Worker key |

**Response data** — `null`

```bash
curl -X POST "http://localhost:3001/api/worker-login?key=worker_abc"
```

---

## POST /api/worker-logout?key=

登出 Worker。

**Query 参数**

| 参数 | 类型 | 说明 |
|---|---|---|
| `key` | string | Worker key |

**Response data** — `null`

```bash
curl -X POST "http://localhost:3001/api/worker-logout?key=worker_abc"
```

---

## GET /api/worker-updateWxaList?key=

刷新该 Worker 账号下的小程序列表，结果更新到 `wxaList` 字段。

**Query 参数**

| 参数 | 类型 | 说明 |
|---|---|---|
| `key` | string | Worker key |

**Response data** — `null`（完成后通过 `worker-detail` 读取 `wxaList`）

```bash
curl "http://localhost:3001/api/worker-updateWxaList?key=worker_abc"
```

---

## POST /api/worker-markWXAppId?key=

标记或取消标记某个小程序（标记后可用于批量任务筛选）。

**Query 参数**

| 参数 | 类型 | 说明 |
|---|---|---|
| `key` | string | Worker key |

**Request body**
```json
{
  "appId": "wx1234567890abcdef",
  "mark": true
}
```

`mark: true` 为标记，`mark: false` 为取消标记。

**Response data** — `null`

```bash
curl -X POST "http://localhost:3001/api/worker-markWXAppId?key=worker_abc" \
  -H "Content-Type: application/json" \
  -d '{"appId": "wx1234567890abcdef", "mark": true}'
```
