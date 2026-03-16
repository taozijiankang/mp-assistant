# File API

## POST /api/upload-file

上传文件到服务端，返回服务端存储路径（供后续接口的 `filePath` 参数使用）。

**Request** — `multipart/form-data`

| 字段名 | 类型 | 说明 |
|---|---|---|
| `file` | File | 要上传的文件 |

**Response data** — `string`，服务端文件路径

**curl 示例**
```bash
curl -X POST http://localhost:3001/api/upload-file \
  -F "file=@/path/to/local/image.jpg"
```

**响应示例**
```json
{
  "code": 200,
  "message": "ok",
  "data": "/tmp/uploads/image_1234567890.jpg"
}
```

---

## GET /api/get-file?filePath=

从服务端下载文件，直接返回文件流（非 JSON）。

**Query 参数**

| 参数 | 类型 | 说明 |
|---|---|---|
| `filePath` | string | 服务端文件路径（通常来自 upload-file 响应或 loginQRCodeFilePath） |

**Response** — 文件二进制流，Content-Type 根据文件类型自动设置

**curl 示例**
```bash
# 下载并保存到本地
curl "http://localhost:3001/api/get-file?filePath=/tmp/uploads/image.jpg" -o output.jpg

# 下载登录二维码
curl "http://localhost:3001/api/get-file?filePath=/tmp/qrcode_abc123.png" -o qrcode.png
```
