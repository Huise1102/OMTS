# API 接口文档

- **Base URL**：`http://localhost:3000/api`
- **数据格式**：请求与响应均为 `application/json`（UTF-8）
- **鉴权方式**：JWT，需在请求头携带 `Authorization: Bearer <token>`；标注 🔒 的接口必须登录
- **源码位置**：`server/routes/`，路由挂载见 [app.js](../server/app.js)

---

## 一、通用约定

### 1. 统一响应结构

```json
{ "code": 0, "message": "success", "data": {} }
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `code` | number | `0` 成功；`1` 业务失败；`401` 未登录/登录过期；`404` 接口不存在；`500` 服务器异常 |
| `message` | string | 提示文案，可直接用于前端 toast |
| `data` | any | 业务数据，失败时通常为 `null` |

### 2. 状态码约定

| HTTP 状态 | 场景 |
| --- | --- |
| `200` | 业务成功，或业务校验失败（此时 `code = 1`，由前端按 `code` 判断） |
| `401` | 未携带 Token、Token 无效或已过期 |
| `404` | 路由不存在 |
| `500` | 服务端未捕获异常，统一由 [errorHandler.js](../server/middleware/errorHandler.js) 处理 |

### 3. 订单状态

| 值 | 含义 | 可执行操作 |
| --- | --- | --- |
| `0` | 待支付 | 支付、取消 |
| `1` | 已支付 | 退票 |
| `2` | 已完成 | 退票 |
| `3` | 已退票 | — |
| `4` | 已取消 | — |

---

## 二、健康检查

### GET `/api/health`

无需鉴权，用于探活。

```json
{ "code": 0, "message": "ok", "data": { "time": "2026-10-23T08:00:00.000Z" } }
```

---

## 三、认证模块 `/api/auth`

### 3.1 注册

`POST /register`

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `username` | string | 是 | 登录账号，唯一 |
| `password` | string | 是 | 明文密码，服务端 bcrypt 加密存储 |
| `nickname` | string | 否 | 昵称，缺省等于账号 |
| `phone` | string | 否 | 手机号 |

```json
// 请求
{ "username": "newuser", "password": "123456", "nickname": "新用户" }

// 成功
{ "code": 0, "message": "注册成功", "data": { "id": 5 } }

// 失败
{ "code": 1, "message": "用户名已存在", "data": null }
```

### 3.2 登录

`POST /login`

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `username` | string | 是 | 登录账号 |
| `password` | string | 是 | 密码 |

```json
// 成功
{
  "code": 0,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": { "id": 1, "username": "testuser", "nickname": "测试用户", "avatar": null }
  }
}

// 失败
{ "code": 1, "message": "用户名或密码错误", "data": null }
```

> Token 有效期 7 天，Payload 为 `{ id, username }`。

---

## 四、影片模块 `/api/movie`

### 4.1 轮播图

`GET /banner` → `data` 为数组

```json
[{ "id": 1, "title": "霸王别姬 热映中", "image_url": "/static/banner/1.jpg",
   "link_type": "movie", "link_id": 1, "sort": 1, "status": 1 }]
```

### 4.2 影片类型

`GET /category`

```json
[{ "id": 1, "name": "剧情", "sort": 1 }]
```

### 4.3 影院列表

`GET /cinema`

```json
[{ "id": 1, "name": "星辉影城（中心城店）", "address": "示例市朝阳路88号",
   "city": "示例市", "phone": "0755-88886666" }]
```

### 4.4 热门推荐

`GET /hot`

按 `is_hot DESC, rating DESC, box_office DESC` 取热映影片前 10 部。

```json
[{ "id": 1, "title": "霸王别姬", "director": "陈凯歌", "actors": "张国荣,张丰毅,巩俐",
   "duration": 171, "release_date": "1993-01-01", "language": "国语",
   "version": "2D", "rating": "9.6", "description": "...", "poster_url": null,
   "status": 1, "is_hot": 1, "box_office": "12000.00" }]
```

### 4.5 影片检索

`GET /list`

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `status` | number | 否 | `1` 热映 / `2` 即将上映 |
| `typeId` | number | 否 | 影片类型 ID |
| `keyword` | string | 否 | 片名模糊匹配 |
| `sort` | string | 否 | `rating` 评分优先 / `release` 上映时间优先；缺省按热门+评分 |

```
GET /api/movie/list?status=1&typeId=1&keyword=霸王&sort=rating
```

返回影片数组，字段同 4.4。

### 4.6 影片详情

`GET /detail/:id`

在影片字段基础上增加 `categories`（类型名称数组）：

```json
{ "id": 1, "title": "霸王别姬", "...": "...", "categories": ["剧情", "爱情", "历史"] }
```

> 影片不存在时返回 `{ "code": 0, "message": "影片不存在", "data": null }`。

---

## 五、场次与座位 `/api/showtime`

### 5.1 场次列表

`GET /list`

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `movieId` | number | 否 | 影片 ID；**不传会返回全部影片的场次** |
| `date` | string | 否 | `YYYY-MM-DD` |

```json
[{
  "id": 37, "movie_id": 29, "cinema_id": 1, "hall_id": 1,
  "show_date": "2026-10-24", "show_time": "14:00:00", "version": "2D",
  "price": "38.00", "origin_price": "53.00",
  "total_seat": 48, "sold_seat": 0, "status": 1,
  "hall_name": "1号激光厅", "cinema_name": "星辉影城（中心城店）", "movie_title": "千与千寻"
}]
```

### 5.2 场次详情

`GET /detail/:id`

用于选座页在刷新或直达时获取票价与影片信息（不依赖列表页中转的数据）。

```json
{
  "id": 19, "movie_id": 29, "cinema_id": 1, "hall_id": 4,
  "show_date": "2026-10-23", "show_time": "14:00:00", "version": "3D",
  "price": "58.00", "origin_price": "78.00",
  "total_seat": 36, "sold_seat": 6, "status": 1,
  "hall_name": "4号亲子厅", "cinema_name": "星辉影城（中心城店）", "movie_title": "千与千寻"
}
```

### 5.3 座位图

`GET /seat/:showtimeId`

```json
{
  "hall": { "id": 1, "name": "1号激光厅", "rows": 6, "cols": 8, "total_seat": 48 },
  "seats": [
    { "id": 1, "seat_row": 1, "seat_col": 1, "seat_type": "普通", "status": 1, "sold": false }
  ]
}
```

| 字段 | 说明 |
| --- | --- |
| `status` | 座位自身状态：`1` 可用 / `0` 禁用 |
| `sold` | 该场次是否已售（订单 `status IN (1,2)` 且明细 `status = 1`） |

> 前端渲染状态：`sold` 优先显示已售，其次 `status = 0` 显示不可选。

---

## 六、订单模块 `/api/order`（均需登录 🔒）

### 6.1 创建订单

`POST /create`

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `showtimeId` | number | 是 | 场次 ID |
| `seatIds` | number[] | 是 | 座位 ID 数组，至少 1 个 |

服务端在事务中 `FOR UPDATE` 锁定场次、复查座位占用，再写入订单与明细。

```json
// 成功
{ "code": 0, "message": "下单成功，请尽快支付",
  "data": { "orderId": 9, "orderNo": "C1761550000000A1B2C3", "totalAmount": 38 } }

// 座位被占
{ "code": 1, "message": "所选座位已被占用，请重新选择", "data": null }
```

### 6.2 模拟支付

`POST /pay/:id` → 订单 `0 → 1`，同时累加场次 `sold_seat`

```json
{ "code": 0, "message": "支付成功", "data": null }
```

### 6.3 取消订单

`POST /cancel/:id` → 仅待支付可取消，订单置 `4`，明细置 `0`（释放座位）

### 6.4 退票

`POST /refund/:id` → 已支付/已完成可退，订单置 `3`，明细置 `0`，回退场次 `sold_seat`

### 6.5 清除历史订单

`POST /clear` → 删除当前用户 `status IN (2,3,4)` 的订单及其明细，保留待支付与已支付

```json
{ "code": 0, "message": "已清除 2 条历史订单", "data": { "count": 2 } }

// 无可清除
{ "code": 0, "message": "暂无可清除的历史订单", "data": { "count": 0 } }
```

### 6.6 订单列表

`GET /list?status=`

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `status` | number | 否 | 订单状态；不传返回全部 |

```json
[{
  "id": 9, "order_no": "C1761550000000A1B2C3", "total_amount": "38.00",
  "ticket_qty": 1, "status": 0, "created_at": "2026-10-23 15:20:00",
  "movie_title": "千与千寻", "cinema_name": "星辉影城（中心城店）",
  "hall_name": "1号激光厅", "show_date": "2026-10-24", "show_time": "14:00:00"
}]
```

### 6.7 订单详情

`GET /detail/:id`

在订单字段基础上含影片/影院/影厅/场次信息与票明细：

```json
{
  "id": 9, "order_no": "C1761550000000A1B2C3", "user_id": 1, "movie_id": 29,
  "total_amount": "38.00", "ticket_qty": 1, "status": 0,
  "created_at": "2026-10-23 15:20:00", "paid_at": null,
  "movie_title": "千与千寻", "cinema_name": "星辉影城（中心城店）",
  "hall_name": "1号激光厅", "show_date": "2026-10-24", "show_time": "14:00:00",
  "tickets": [
    { "id": 15, "order_id": 9, "showtime_id": 37, "seat_id": 1,
      "price": "38.00", "qr_code": null, "status": 1, "seat_row": 1, "seat_col": 1 }
  ]
}
```

> 取票二维码由前端按订单号生成，内容为 `CINEMA:<orderNo>`。

---

## 七、智能对话 `/api/chat`（均需登录 🔒）

### 7.1 发送消息

`POST /chat`

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `message` | string | 是 | 用户输入 |
| `sessionId` | string | 否 | 会话 UUID；不传则新建会话 |

```json
// 纯查询
{ "code": 0, "message": "success",
  "data": { "sessionId": "6f1c...", "reply": "近期热门影片有……", "pendingAction": null } }

// 涉及写操作，返回待确认卡片
{
  "code": 0, "message": "success",
  "data": {
    "sessionId": "6f1c...",
    "reply": "已为你挑选 1 个座位，请确认",
    "pendingAction": {
      "pending": true,
      "type": "create_order",
      "title": "确认下单",
      "summary": "场次 2026-10-24 14:00:00，座位 1 个，合计 ¥38.00",
      "params": { "showtimeId": 37, "seatIds": [1] }
    }
  }
}
```

`pendingAction.type` 与前端处理方式：

| type | params | 用户确认后调用的接口 |
| --- | --- | --- |
| `create_order` | `{ showtimeId, seatIds }` | `POST /api/order/create` |
| `refund_order` | `{ id }` | `POST /api/order/refund/:id` |

### 7.2 会话列表

`GET /session` → 当前用户的会话，按 `updated_at DESC`

```json
[{ "id": 3, "session_id": "6f1c...", "user_id": 1, "title": "帮我订一张票",
   "status": 1, "created_at": "...", "updated_at": "..." }]
```

### 7.3 会话历史

`GET /history/:sessionId` → 仅返回 `user` / `assistant` 两类消息，按时间升序

```json
[{ "role": "user", "content": "最近有什么好看的电影" },
 { "role": "assistant", "content": "近期热门影片有……" }]
```

### 7.4 清空历史会话

`DELETE /session` → 删除当前用户的全部会话及聊天记录（事务内执行）

```json
{ "code": 0, "message": "success", "data": { "count": 11 } }
```

### 7.5 助手可调用的工具（Function Calling）

定义见 [tools.js](../server/agent/tools.js)，模型在 3 轮以内完成「补参数 → 执行 → 回复」：

| 工具 | 作用 | 是否写操作 |
| --- | --- | --- |
| `query_movies` | 按类型/关键词/热度查影片 | 否 |
| `query_showtimes` | 按影片与日期查场次 | 否 |
| `query_seats` | 查某场次座位与占用情况 | 否 |
| `query_orders` | 查当前用户订单 | 否 |
| `query_guide` | 查询观影指南（取票、退票、儿童票等） | 否 |
| `create_order` | 创建订单 | 是（返回待确认，不落库） |
| `refund_order` | 退票 | 是（返回待确认，不落库） |

---

## 八、错误示例

```json
// 未登录 / Token 过期（HTTP 401）
{ "code": 401, "message": "登录已过期，请重新登录", "data": null }

// 业务校验失败（HTTP 200，code = 1）
{ "code": 1, "message": "当前订单状态不可支付", "data": null }

// 接口不存在（HTTP 404）
{ "code": 404, "message": "接口不存在", "data": null }
```

---

## 九、联调示例（PowerShell）

```powershell
# 登录并取 Token
$r = Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/auth/login `
     -ContentType 'application/json' -Body '{"username":"testuser","password":"123456"}'
$token = $r.data.token

# 带鉴权查询我的订单
Invoke-RestMethod -Uri http://localhost:3000/api/order/list `
  -Headers @{ Authorization = "Bearer $token" }
```

> Windows PowerShell 5.1 发送中文请求体会出现编码问题，中文参数建议用 Postman、Apifox 或 Node 客户端测试。
