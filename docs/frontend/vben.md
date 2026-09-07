# Vben Admin 对接

项目的接口命名已覆盖 Vben 登录流程所需的基本元素，但并非开箱即用的完整 Vben 服务端。前端需要配置响应解包、Cookie 和刷新逻辑；后端仍需补齐动态菜单等接口。

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
console.log(userInfo.userId, userInfo.roles)
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

Vben 请求客户端应以 `code === 0` 或 `success === true` 判断成功，并把 `data` 作为业务结果。HTTP 401 用于无效 / 缺失 / 过期 Refresh Token，HTTP 403 用于权限不足；业务错误还需读取响应体 `code`。

## 登录流程映射

| Vben 场景 | 当前接口 | 说明 |
| --- | --- | --- |
| 登录 | `POST /auth/login` | body 为 `username`、`password`；返回 `data.accessToken` |
| 当前用户 | `GET /user/info` | 返回 `userId`、`username`、`realName`、`avatar`、`homePath`、`desc` 和 `roles` |
| 权限码 | `GET /auth/codes` | 当前返回角色 code，而非菜单 permission |
| 刷新令牌 | `POST /auth/refresh` | Refresh Token 来自 HttpOnly Cookie，成功后轮换 Cookie |
| 退出 | `POST /auth/logout` | Access Token 进入黑名单，并撤销/清除 Refresh Token |
| 动态菜单 | 未实现 | 菜单实体存在，Controller 无接口 |

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
