# HTTP API

以下列表来自当前 Controller 实现。默认全局前缀为 `/api`；表中路径省略此前缀。

## 已实现接口

| 方法 | 路径 | 鉴权 | 功能 |
| --- | --- | --- | --- |
| `POST` | `/auth/login` | 公开 | 用户名密码登录，返回 Access Token 并设置 Refresh Token Cookie |
| `POST` | `/auth/refresh` | 公开 | 从 Cookie 读取并轮换 Refresh Token |
| `POST` | `/auth/logout` | JWT | 注销当前 Access Token |
| `GET` | `/auth/codes` | JWT | 返回当前登录上下文的角色 code 数组 |
| `GET` | `/user/info` | JWT | 返回当前用户信息、`realName` 与角色数组 |
| `GET` | `/system/user/list` | JWT | 分页查询系统用户，支持按 `id`、`nickname` 排序 |

`MenuController`、`RoleController`、`AiController` 和 `CacheController` 当前没有路由，不能作为可用 API。

## 登录

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "your-password"
}
```

成功业务数据：

```json
{
  "accessToken": "eyJ..."
}
```

该对象位于统一响应的 `data` 字段。用户名至少 4 个字符，密码至少 6 个字符；初始化脚本要求超级管理员密码至少 8 个字符。

## 用户列表分页

`nestjs-paginate` 负责解析 `/system/user/list` 查询参数。常用参数包括 `page`、`limit`、`sortBy`；实际格式以项目所用 `nestjs-paginate` 版本和 Swagger 输出为准。

```http
GET /api/system/user/list?page=1&limit=10&sortBy=nickname:ASC
Authorization: Bearer eyJ...
```

## Swagger

当 `SWAGGER_ENABLE=true` 时：

- UI：`/<SWAGGER_PATH>`，示例为 `/api-docs`；
- JSON：`/<SWAGGER_PATH>/json`；
- OpenAPI Server URL 指向 `/<GLOBAL_PREFIX>`。

WebSocket Swagger 的初始化在 `main.ts` 中被注释，目前不会暴露 `/ws-docs`。
