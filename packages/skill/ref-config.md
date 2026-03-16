# Config API

## GET /api/config

获取当前服务配置。

**Response data**
```ts
{
  headless: boolean;  // 是否无头模式运行浏览器
  port: number;       // 服务端口
}
```

**curl 示例**
```bash
curl http://localhost:3001/api/config
```

**响应示例**
```json
{
  "code": 200,
  "message": "ok",
  "data": {
    "headless": true,
    "port": 3001
  }
}
```

---

## POST /api/config

更新服务配置，字段均为可选（Partial）。

**Request body**
```ts
{
  headless?: boolean;
  port?: number;
}
```

**Response data** — 同 GET，返回更新后的完整配置

**curl 示例**
```bash
curl -X POST http://localhost:3001/api/config \
  -H "Content-Type: application/json" \
  -d '{"headless": false}'
```

**响应示例**
```json
{
  "code": 200,
  "message": "ok",
  "data": {
    "headless": false,
    "port": 3001
  }
}
```
