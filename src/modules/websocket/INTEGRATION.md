# WebSocket 模块集成总结

## ✅ 已完成的工作

### 1. 安装依赖
```bash
pnpm add @nestjs/websockets @nestjs/platform-socket.io socket.io
```

### 2. 创建的文件结构

```
src/modules/
├── auth/
│   └── decorators/
│       ├── permission.decorator.ts  ✨ 新增：权限装饰器
│       └── index.ts                 ✨ 新增：装饰器导出
└── websocket/
    ├── guards/
    │   ├── ws-jwt.guard.ts          ✨ WebSocket JWT 认证守卫
    │   └── ws-rbac.guard.ts         ✨ WebSocket RBAC 权限守卫
    ├── filters/
    │   └── ws-exception.filter.ts   ✨ WebSocket 异常过滤器
    ├── interceptors/
    │   └── ws-trace.interceptor.ts  ✨ WebSocket TraceId 拦截器
    ├── gateways/
    │   └── chat.gateway.ts          ✨ 示例 Gateway
    ├── websocket.module.ts          ✨ WebSocket 模块定义
    ├── index.ts                     ✨ 导出文件
    ├── README.md                    ✨ 详细文档
    └── websocket-client-test.html   ✨ 浏览器测试客户端
```

### 3. 核心架构：逻辑复用 + 适配层

#### ✅ 100% 复用的业务逻辑
- **JWT 验证**: `JwtService.verifyAsync()` + `TokenService.checkAccessToken()`
- **RBAC 权限**: `AuthService.getPermissionsByUserId()` + `AuthService.getPermissionsCache()`
- **Token 黑名单**: `authKeys.tokenBlacklist()`
- **密码版本检查**: `authKeys.passwordVersion()`
- **TraceId 存储**: `TraceContext` (AsyncLocalStorage)
- **业务异常**: `BusinessException` + `ERROR_CODES`

#### ✅ 适配的传输层
- **上下文切换**: `context.switchToHttp()` → `context.switchToWs()`
- **用户注入**: `req.user` → `client.user`
- **Token 提取**: `req.headers.authorization` → `client.handshake.auth.token`
- **错误响应**: `response.send()` → `client.emit('error')`

## 🎯 使用方式

### 1. 客户端连接

```typescript
import { io } from 'socket.io-client'

const socket = io('http://localhost:3000/chat', {
  auth: {
    token: 'your-jwt-token' // 从登录接口获取
  }
})

// 监听错误
socket.on('error', (error) => {
  console.error('WebSocket Error:', error)
})

// 发送消息
socket.emit('message', { content: 'Hello' })

// 监听响应
socket.on('message', (data) => {
  console.log('Received:', data)
})
```

### 2. 创建新的 Gateway

```typescript
import {
  WebSocketGateway,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets'
import { UseGuards, UseFilters, UseInterceptors } from '@nestjs/common'
import { Socket } from 'socket.io'
import { WsJwtGuard } from '../guards/ws-jwt.guard'
import { WsRbacGuard } from '../guards/ws-rbac.guard'
import { WsExceptionFilter } from '../filters/ws-exception.filter'
import { WsTraceInterceptor } from '../interceptors/ws-trace.interceptor'
import { RequirePermissions } from '@/modules/auth/decorators'

@WebSocketGateway({ namespace: '/your-namespace' })
@UseGuards(WsJwtGuard, WsRbacGuard)      // JWT + RBAC 认证
@UseFilters(WsExceptionFilter)            // 异常处理
@UseInterceptors(WsTraceInterceptor)      // TraceId 追踪
export class YourGateway {
  @SubscribeMessage('event-name')
  handleEvent(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ) {
    // client.user 由 handleConnection 自动注入
    const user = client.user as LoginUserContext 
    return { event: 'response', data: { ... } }
  }

  @SubscribeMessage('admin-only')
  @RequirePermissions('system:admin')  // 需要特定权限
  handleAdminEvent(@MessageBody() data: any) {
    // WsRbacGuard 会自动检查权限
  }
}
```

## 🧪 测试步骤

### 1. 启动后端服务
```bash
cd backend
npm run start:dev
```

### 2. 获取 JWT Token
使用 Postman 或其他工具调用登录接口：
```
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "username": "your-username",
  "password": "your-password"
}
```

复制响应中的 `access_token`

### 3. 使用浏览器测试客户端
在浏览器中打开 `websocket-client-test.html`：
1. 输入服务器地址和命名空间
2. 粘贴 JWT Token
3. 点击"连接"
4. 测试各种操作

### 4. 使用 Node.js 测试客户端

```javascript
// test-client.js
const { io } = require('socket.io-client')

const token = 'your-jwt-token'
const socket = io('http://localhost:3000/chat', {
  auth: { token }
})

socket.on('connect', () => {
  console.log('✅ Connected:', socket.id)

  // 测试 1: 发送消息
  socket.emit('message', { content: 'Hello from Node.js' })

  // 测试 2: Ping
  socket.emit('ping', {})
})

socket.on('message', (data) => {
  console.log('📨 Message:', data)
})

socket.on('pong', (data) => {
  console.log('🏓 Pong:', data)
})

socket.on('error', (error) => {
  console.error('❌ Error:', error)
})
```

运行：
```bash
npm install socket.io-client
node test-client.js
```

## 📊 与 HTTP 的对比

| 对比项 | HTTP | WebSocket |
|--------|------|-----------|
| **Token 传递** | `Authorization: Bearer xxx` | `auth.token` 或 `headers.Authorization` |
| **用户注入** | `req.user` | `client.user` |
| **上下文切换** | `context.switchToHttp()` | `context.switchToWs()` |
| **错误响应** | `response.status(xxx).send()` | `client.emit('error', body)` |
| **TraceId** | TraceMiddleware (全局) | WsTraceInterceptor (每条消息) |
| **连接类型** | 短连接（请求-响应） | 长连接（持久化） |

## ⚠️ 注意事项

1. **JWT Token 的传递方式**
   - 推荐：`auth.token` (连接时传递，安全)
   - 不推荐：查询参数 `?token=xxx` (会暴露在日志中)

2. **权限检查的粒度**
   - Gateway 级别：整个 Gateway 需要认证
   - Handler 级别：特定事件需要权限

3. **公开接口**
   - 使用 `@Public()` 装饰器跳过认证
   - 例如：ping、健康检查等

4. **错误处理**
   - 所有 Gateway 必须使用 `@UseFilters(WsExceptionFilter)`
   - 异常会自动通过 `client.emit('error')` 发送

5. **TraceId 追踪**
   - 所有 Gateway 必须使用 `@UseInterceptors(WsTraceInterceptor)`
   - 日志会自动包含 traceId，方便问题追踪

## 🔑 关键文件说明

### ws-jwt.guard.ts
- 从 `handshake.auth.token` 或 `headers.authorization` 提取 token
- 调用 `JwtService` 验证 token
- 检查 token 黑名单、密码版本
- handleConnection 将 user 注入到 `client.user`

### ws-rbac.guard.ts
- 从 `client.user` 获取用户信息
- 检查 `@RequirePermissions` 装饰器
- 调用 `AuthService.getPermissionsByUserId()` 获取权限
- 验证用户是否有所需权限

### ws-exception.filter.ts
- 捕获 `BusinessException`、`WsException`、`HttpException`
- 提取 traceId 和错误信息
- 通过 `client.emit('error')` 发送错误响应

### ws-trace.interceptor.ts
- 提取或生成 traceId
- 注入到 `TraceContext` (AsyncLocalStorage)
- 记录请求耗时和日志

## 🎉 总结

这个 WebSocket 模块完全遵循了"逻辑复用 + 适配层"的行业最佳实践：

✅ **核心安全逻辑 100% 复用** - 与 HTTP 完全一致的认证授权体系  
✅ **仅适配传输层差异** - 最小化差异，降低维护成本  
✅ **符合 NestJS 规范** - 使用官方推荐的 Guards/Filters/Interceptors 模式  
✅ **生产级代码质量** - 完整的错误处理、日志追踪、类型安全  
✅ **开箱即用** - 提供完整的测试客户端和文档  

现在你可以安全地在 HTTP 和 WebSocket 之间共享同一套安全策略，修改一处，两边生效！
