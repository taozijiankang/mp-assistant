# Task API

## BaseTaskInfo 数据结构

```ts
interface BaseTaskInfo {
  key: string;                      // 任务唯一标识
  workerKey: string;                // 所属 Worker key
  type: TaskType;                   // "wxnInspectVersion" | "wxnAudit" | "wxnPublish"
  status: TaskStatus;               // "notStarted" | "running" | "completed" | "failed"
  options: TaskOptions;             // 任务参数（见下方各类型说明）
  runningReportList: TaskRunningReport[]; // 执行过程日志
  result?: {
    data?: any;                     // 任务结果数据
    msg?: string;                   // 结果描述
  };
  createTime: number;               // 创建时间戳（ms）
  startTime: number;                // 开始时间戳（ms）
  endTime: number;                  // 结束时间戳（ms）
}

interface TaskRunningReport {
  title: string;
  timestamp: number;
  description?: string;
  images?: string[];                // 服务端图片路径，用 GET /api/get-file 下载
}
```

---

## 任务 options 详细字段

### 公共基础字段（所有任务类型）

```ts
interface TaskOptions {
  appid: string;      // 小程序 appid，运行时根据所属 worker 的 wxaList 取 app_name / username
}
```

### wxnInspectVersion — 检查版本

使用基础 `TaskOptions`，无额外字段。

`result.data` 类型为 `GetVersionListResult[]`，每项结构：
```ts
{
  online_info?: VersionListItem;    // 线上版本
  experience_info?: VersionListItem; // 体验版
  develop_info?: VersionListItem[]; // 开发版列表
}
```

### wxnAudit — 提交审核

```ts
interface AuditTaskOptions extends TaskOptions {
  positioner?: VersionPositioner[]; // 版本筛选条件（见下方）
  populateData?: {
    versionDescription?: string;    // 版本描述
    imagePreview?: string;          // 图片预览（服务端文件路径）
    videoPreview?: string;          // 视频预览（服务端文件路径）
  };
}
```

### wxnPublish — 发布上线

```ts
interface ReleaseTaskOptions extends TaskOptions {
  positioner?: VersionPositioner[]; // 版本筛选条件（见下方）
}
```

发布任务额外字段（在 taskDetail 响应中）：
```ts
publishQRCodeFilePath: string;  // 发布二维码服务端路径
countdown: number;              // 倒计时（秒）
refreshLoading: boolean;        // 是否正在刷新二维码
```

---

## VersionPositioner 结构

用于在审核/发布时从开发版列表中筛选目标版本，多个条件为 AND 关系。

```ts
interface VersionPositioner {
  type: "describe" | "nick_name" | "version"; // 匹配字段
  criteria: "Equal" | "Inclusion";            // 匹配方式：等于 / 包含
  value: string;                              // 匹配值
}
```

**示例**：选择版本号包含 "1.2" 且发布者等于 "张三" 的版本：
```json
[
  { "type": "version", "criteria": "Inclusion", "value": "1.2" },
  { "type": "nick_name", "criteria": "Equal", "value": "张三" }
]
```

---

## POST /api/worker-addTask?key=

为 Worker 添加任务。

**Query 参数**

| 参数 | 类型 | 说明 |
|---|---|---|
| `key` | string | Worker key |

**Request body**
```json
{
  "type": "wxnAudit",
  "options": {
    "app_name": "我的小程序",
    "username": "gh_xxxxxxxx",
    "positioner": [
      { "type": "version", "criteria": "Inclusion", "value": "1.0" }
    ]
  }
}
```

**Response data** — `WXWorkInfo`（含新增任务的 Worker 信息）

```bash
curl -X POST "http://localhost:3001/api/worker-addTask?key=worker_abc" \
  -H "Content-Type: application/json" \
  -d '{"type":"wxnInspectVersion","options":{"app_name":"我的小程序","username":"gh_xxxxxxxx"}}'
```

---

## DELETE /api/worker-removeTask?key=&taskKey=

删除任务。

**Query 参数**

| 参数 | 类型 | 说明 |
|---|---|---|
| `key` | string | Worker key |
| `taskKey` | string | 任务 key |

**Response data** — `WXWorkInfo`

```bash
curl -X DELETE "http://localhost:3001/api/worker-removeTask?key=worker_abc&taskKey=task_xyz"
```

---

## GET /api/worker-taskDetail?key=&taskKey=

查询任务详情，可轮询此接口跟踪任务进度。

**Query 参数**

| 参数 | 类型 | 说明 |
|---|---|---|
| `key` | string | Worker key |
| `taskKey` | string | 任务 key |

**Response data** — `BaseTaskInfo`

```bash
curl "http://localhost:3001/api/worker-taskDetail?key=worker_abc&taskKey=task_xyz"
```

**轮询建议**：每 2 秒查询一次，直到 `status` 为 `completed` 或 `failed`。

---

## POST /api/worker-getPublishQRCode?key=&taskKey=

触发生成发布二维码（仅 `wxnPublish` 任务使用）。调用后轮询 `worker-taskDetail`，当 `publishQRCodeFilePath` 非空时用 `GET /api/get-file` 下载展示。

**Query 参数**

| 参数 | 类型 | 说明 |
|---|---|---|
| `key` | string | Worker key |
| `taskKey` | string | 任务 key |

**Response data** — `null`

```bash
curl -X POST "http://localhost:3001/api/worker-getPublishQRCode?key=worker_abc&taskKey=task_xyz"
```
