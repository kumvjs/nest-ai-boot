# Vben Admin 对接

项目的接口命名已覆盖 Vben 登录流程和动态菜单所需的基本元素，但并非开箱即用的完整 Vben 服务端。前端需要配置响应解包、Cookie 和刷新逻辑；后端仍需补齐系统管理 CRUD 等接口。

## OpenAPI-TS 快速对接

推荐让 Vben 直接从本项目 Swagger 生成请求函数和类型，再通过一个很薄的 `apiClient` 复用 Vben 的 Axios 实例并统一解包 `ResOp.data`。

### 1. 启动 Swagger 并安装生成器

确认后端启用了 `SWAGGER_ENABLE=true`，Swagger JSON 默认地址为：

```text
http://127.0.0.1:7001/api-docs/json
```

在 Vben 应用中安装 `@hey-api/openapi-ts` 和 Axios 插件，并增加脚本：

```json
{
  "scripts": {
    "openapi-ts": "openapi-ts"
  },
  "devDependencies": {
    "@hey-api/client-axios": "^0.9.1",
    "@hey-api/openapi-ts": "^0.98.1"
  }
}
```

### 2. 添加生成配置

在 Vben 应用目录创建 `openapi-ts.config.ts`：

```ts
import { defineConfig } from '@hey-api/openapi-ts'

export default defineConfig({
  input: 'http://127.0.0.1:7001/api-docs/json',
  output: 'src/client',
  plugins: [
    {
      name: '@hey-api/client-axios',
      throwOnError: true,
    },
    {
      name: '@hey-api/sdk',
      operations: { strategy: 'flat' },
    },
  ],
})
```

执行生成：

```bash
pnpm openapi-ts
```

`src/client` 是生成目录，应通过重新执行命令更新，不要手工修改其中的请求函数和 DTO。

### 3. 让生成客户端复用 Vben 请求实例

`request.ts` 中的 `requestClient` 必须安装 Vben 的统一响应拦截器：

```ts
requestClient.addResponseInterceptor(
  defaultResponseInterceptor({
    codeField: 'code',
    dataField: 'data',
    successCode: 0,
  }),
)
```

然后创建 `src/api/api-client.ts`：

```ts
import type { AxiosResponse } from 'axios'
import { client } from '#/client/client.gen'
import { requestClient } from './request'

type ApiOptions<F extends (...args: any[]) => Promise<any>> = Parameters<F>[0]

type UnwrappedResponse<F extends (...args: any[]) => Promise<any>> =
  ReturnType<F> extends Promise<infer R>
    ? R extends { data: undefined, error: unknown }
      ? never
      : R extends AxiosResponse<infer Body>
        ? Body extends { data?: infer Data } ? Data : Body
        : R extends { data?: infer Data } ? Data : R
    : never

client.setConfig({
  axios: requestClient.instance,
  throwOnError: true,
})

export async function apiRequest<F extends (...args: any[]) => Promise<any>>(
  apiMethod: F,
  options: ApiOptions<F> = {} as ApiOptions<F>,
): Promise<UnwrappedResponse<F>> {
  const response = await apiMethod({ throwOnError: true, ...options })
  return response as unknown as UnwrappedResponse<F>
}
```

### 4. 调用生成接口

生成函数名称由 Swagger `operationId` 决定，以实际生成结果为准：

```ts
import {
  authControllerCodes,
  authControllerLogin,
  authControllerRefresh,
  userControllerInfo,
} from '#/client'
import { apiRequest } from '#/api/api-client'

const loginResult = await apiRequest(authControllerLogin, {
  body: { username: 'admin', password: 'your-password' },
  withCredentials: true,
})
accessStore.setAccessToken(loginResult.accessToken)

const userInfo = await apiRequest(userControllerInfo)
const accessCodes = await apiRequest(authControllerCodes)
console.log(userInfo.userId, userInfo.roles, accessCodes)
```

刷新接口同样返回 `ResOp<{ accessToken }>`，不要为它创建“裸字符串”特例：

```ts
const result = await apiRequest(authControllerRefresh, {
  withCredentials: true,
})
accessStore.setAccessToken(result.accessToken)
```

登录、刷新和退出必须携带 `withCredentials: true`，否则浏览器不会接收或发送 HttpOnly Refresh Token Cookie。

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

Vben 请求客户端应以 `code === 0` 或 `success === true` 判断成功，并把 `data` 作为业务结果。HTTP 401 用于无效 / 缺失 / 过期 Refresh Token；HTTP 403 用于权限不足或浏览器 Origin 不受信任；业务错误还需读取响应体 `code`。

## 登录流程映射

| Vben 场景 | 当前接口 | 说明 |
| --- | --- | --- |
| 登录 | `POST /auth/login` | body 为 `username`、`password`；返回 `data.accessToken` |
| 当前用户 | `GET /user/info` | 返回 `userId`、`username`、`realName`、`avatar`、`homePath`、`desc` 和 `roles` |
| 权限码 | `GET /auth/codes` | 返回当前用户有效的菜单/按钮 `authCode` 数组 |
| 刷新令牌 | `POST /auth/refresh` | Refresh Token 来自 HttpOnly Cookie，成功后轮换 Cookie |
| 退出 | `POST /auth/logout` | Access Token 进入黑名单，并撤销/清除 Refresh Token |
| 动态菜单 | `GET /menu/all` | 返回当前用户可访问的 Vben 动态路由树 |

登录响应业务码为 `20004` 时表示账号已停用，前端应展示后端消息并结束登录流程，不应继续调用刷新接口或写入 Access Token。

登录请求示例：

```ts
const result = await apiRequest(authControllerLogin, {
  body: { username, password },
  withCredentials: true,
})

tokenStore.setAccessToken(result.accessToken)
```

## 当前兼容性注意事项

### CORS 与 Cookie

后端通过 `APP_CORS_ORIGINS` 使用精确 Origin 白名单，不再把 `credentials: true` 与通配符来源组合。默认本地配置支持 Vben 的 `http://localhost:5999` 和 playground 的 `http://localhost:5555`；使用其他端口时需要加入完整 Origin。

本地默认 Refresh Token Cookie 为 host-only、`Secure=false`、`SameSite=Lax`，Path 限制为 `/api/auth`（全局前缀变化时同步变化）。生产环境要求公开 API 和前端 Origin 均为 HTTPS，并强制 Secure Cookie。不要为了方便把 Refresh Token 暴露给 JavaScript。

同站子域部署通常保留 `SameSite=Lax` 即可。只有前后端确实属于不同站点时，才设置 `AUTH_COOKIE_SAME_SITE=none` 与 `AUTH_COOKIE_SECURE=true`；此时必须把前端准确 Origin 加入白名单。后端会在所有非安全浏览器请求进入认证和业务逻辑之前校验 Origin，非白名单来源返回 HTTP 403。

### 权限语义

后端细粒度权限来自 `sys_menu.auth_code`，对应 Vben 的 `authCode`。`/auth/codes` 与后端 `RbacGuard` 使用同一套 Redis 缓存和 PostgreSQL 回源逻辑，只返回启用角色关联的启用菜单/按钮权限码；启用的 `super` 角色返回全部启用权限码。角色 code 与权限 code 不混用，角色身份从 `/user/info.roles` 获取。

菜单数据模型按 v5.7.0 的 `catalog | menu | embedded | link | button` 五类型建立，并以 JSONB 保存可扩展 `meta`；字段直接采用 Vben 语义，Bigint 菜单 ID 保持字符串，状态直接使用 `0 | 1`。旧菜单表数据不会迁移，需要重新初始化菜单与角色关联。

`GET /menu/all` 已可直接供 Vben 的 `getAllMenusApi()` 使用。普通用户只获得启用角色授权的路由，并自动补齐完整的启用父路由；超级角色获得全部有效路由。按钮只用于权限码，不会作为路由返回。禁用、父链缺失、循环或没有 `path` 的分支会被排除，树中每一级按 `meta.order` 升序、再按唯一 `name` 排序。响应仍由全局 `ResOp` 包装，OpenAPI 客户端解包后业务结果就是 `RouteRecordStringComponent[]`。

菜单写接口仍未开放，不能据此提前调用菜单管理 CRUD。

`GET /system/menu/list` 已开放，可供 playground 菜单管理表格和父菜单选择器读取完整树；它包含按钮和停用项，并要求当前用户具有 `system:menu:list` 权限。`GET /system/menu/name-exists` 与 `GET /system/menu/path-exists` 也已开放，生成的 OpenAPI 客户端解包后直接得到 boolean；编辑时将当前菜单 bigint 字符串 ID 一并传入即可排除自身。菜单创建、修改和删除仍未开放。

菜单、角色或用户授权发生变化后，后端写服务必须在事务提交后失效受影响用户的权限缓存。当前已提供按用户失效能力，具体写接口将在对应系统管理批次接入。

### 尚缺接口

- 菜单、角色、用户的完整 CRUD；
- 用户状态、密码修改，以及菜单/角色/用户写操作中的权限缓存失效挂钩；
- 文件上传等 Vben 常用管理接口。

建议先固定 Vben 所用版本及其 mock API 契约，再以契约测试逐个补齐，避免仅凭路径名称适配。
