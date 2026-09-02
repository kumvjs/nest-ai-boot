# Vben Admin 对接

项目的接口命名已覆盖 Vben 登录流程所需的基本元素，但并非开箱即用的完整 Vben 服务端。前端需要配置响应解包、Cookie 和刷新逻辑；后端仍需补齐动态菜单等接口。

## 基础配置

开发环境 API base URL 通常配置为：

```text
http://localhost:7001/api
```

除公开接口外，请求头需要携带：

```http
Authorization: Bearer <accessToken>
```

所有需要 Refresh Token Cookie 的请求必须启用 `credentials: 'include'` 或 Axios `withCredentials: true`。

## 响应解包

后端统一响应不是直接返回业务对象：

```json
{
  "code": 0,
  "data": { "accessToken": "..." },
  "message": "success",
  "success": true,
  "traceId": "..."
}
```

Vben 请求客户端应以 `code === 0` 或 `success === true` 判断成功，并把 `data` 作为业务结果。HTTP 401 用于无效 / 缺失 / 过期 Refresh Token，HTTP 403 用于权限不足；业务错误还需读取响应体 `code`。

## 登录流程映射

| Vben 场景 | 当前接口 | 说明 |
| --- | --- | --- |
| 登录 | `POST /auth/login` | body 为 `username`、`password`；返回 `data.accessToken` |
| 当前用户 | `GET /user/info` | 返回用户字段、`realName` 和 `roles` |
| 权限码 | `GET /auth/codes` | 当前返回角色 code，而非菜单 permission |
| 刷新令牌 | `POST /auth/refresh` | Refresh Token 来自 HttpOnly Cookie，成功后轮换 Cookie |
| 退出 | `POST /auth/logout` | 当前 Access Token 进入黑名单 |
| 动态菜单 | 未实现 | 菜单实体存在，Controller 无接口 |

登录请求示例：

```ts
const response = await request.post('/auth/login', {
  username,
  password,
}, { withCredentials: true })

tokenStore.setAccessToken(response.data.accessToken)
```

## 当前兼容性注意事项

### CORS 与 Cookie

后端当前配置为 `origin: '*'` 与 `credentials: true`，浏览器不允许凭据请求使用通配符来源。Refresh Token Cookie 又固定为 `secure: true`、`sameSite: 'strict'`，因此普通 HTTP 本地开发以及跨站部署可能无法写入或发送 Cookie。

联调前应把 CORS origin 改成明确的 Vben 地址，并根据同站 / 跨站与 HTTPS 部署方式配置 Cookie。不要为了方便把 Refresh Token 暴露给 JavaScript。

### 权限语义

后端细粒度权限来自 `sys_menu.permission`，但 `/auth/codes` 返回的是 `user.roleCodes`。若 Vben 的按钮权限使用 permission code，应让该接口返回菜单权限，或在前端明确将其作为角色码处理。

### 尚缺接口

- 动态菜单 / 路由树；
- 菜单、角色、用户的完整 CRUD；
- 用户状态、密码修改和权限缓存主动失效流程；
- 文件上传等 Vben 常用管理接口。

建议先固定 Vben 所用版本及其 mock API 契约，再以契约测试逐个补齐，避免仅凭路径名称适配。
