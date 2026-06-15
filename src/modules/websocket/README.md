# WebSocket 模块 - 真正的逻辑复用实现

## 🎯 核心理念

**一套代码同时支持 HTTP 和 WebSocket，而不是维护两套**

### 关键实现

- ✅ **JwtAuthGuard** - 统一支持 HTTP 和 WebSocket（通过 `context.getType()` 适配）
- ✅ **RbacGuard** - 统一支持 HTTP 和 WebSocket
- ✅ **CatchEverythingFilter** - 统一支持 HTTP 和 WebSocket
- ✅ **JwtStrategy** - 统一 Token 提取（`Authorization` Header / `handshake.auth.token`）
- ✅ **TraceMiddleware** - 提供 `extractTraceId()` 静态方法供 WebSocket 复用

## 📁 文件结构

```
src/
├── modules/auth/
│   ├── guards/
│   │   ├── jwt-auth.guard.ts    ✅ 统一支持 HTTP + WS
│   │   └── rbac.guard.ts         ✅ 统一支持 HTTP + WS
│   ├── strategies/
│   │   └── jwt.strategy.ts       ✅ 统一 Token 提取
│   └── decorators/
│       └── permission.decorator.ts  ✅ @RequirePermissions()
├── common/
│   ├── filters/
│   │   └── catch-everything.filter.ts  ✅ 统一支持 HTTP + WS
│   └── middleware/
│       └── trace.middleware.ts         ✅ 提供静态方法供复用
└── modules/websocket/
    ├── interceptors/
    │   └── ws-trace.interceptor.ts     ✅ 复用 TraceMiddleware.extractTraceId()
    ├── gateways/
    │   └── chat.gateway.ts             示例 Gateway
    ├── websocket.module.ts
    ├── REFACTORED.md                   详细重构说明
    ├── README.md                       本文档
    ├── websocket-client-test.html      浏览器测试工具
    └── test-client.js                  Node.js 测试工具
```

## 🚀 使用方式

### 创建 Gateway

```typescript
import {
  WebSocketGateway,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets'
import { UseGuards, UseFilters, UseInterceptors } from '@nestjs/common'
import { Socket } from 'socket.io'
// 直接使用 HTTP 的 Guards 和 Filters ✅
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard'
import { RbacGuard } from '@/modules/auth/guards/rbac.guard'
import { CatchEverythingFilter } from '@/common/filters/catch-everything.filter'
// WebSocket 专用（但复用逻辑）
import { WsTraceInterceptor } from '@/modules/websocket/interceptors/ws-trace.interceptor'
import { RequirePermissions } from '@/modules/auth/decorators'
import { Public } from '@/common/decorators/public.decorator'

@WebSocketGateway({ namespace: '/your-namespace' })
@UseGuards(JwtAuthGuard, RbacGuard)       // 与 HTTP 完全相同
@UseFilters(CatchEverythingFilter)        // 与 HTTP 完全相同
@UseInterceptors(WsTraceInterceptor)
export class YourGateway {
  @SubscribeMessage('event')
  handleEvent(@ConnectedSocket() client: Socket) {
    const user = client.user as LoginUserContext   // handleConnection 自动注入
    return { event: 'response', data: { ... } }
  }

  @SubscribeMessage('admin-event')
  @RequirePermissions('system:admin')  // 与 HTTP 完全相同
  handleAdminEvent() {
    // RbacGuard 自动检查权限
  }

  @SubscribeMessage('public-event')
  @Public()  // 与 HTTP 完全相同
  handlePublicEvent() {
    // 无需认证
  }
}
```

### 客户端连接

```javascript
import { io } from 'socket.io-client'

// Token 传递方式（浏览器 WebSocket API 不能设置 headers）
const socket = io('http://localhost:3000/chat', {
  auth: {
    token: 'your-jwt-token' // JwtStrategy 自动提取
  }
})

socket.on('connect', () => {
  console.log('Connected:', socket.id)
  socket.emit('message', { content: 'Hello' })
})

socket.on('message', (data) => {
  console.log('Received:', data)
})

socket.on('error', (error) => {
  console.error('Error:', error) // CatchEverythingFilter 自动格式化
})
```

## 🔑 核心设计

### 1. Token 提取统一（JwtStrategy）

```typescript
// src/modules/auth/strategies/jwt.strategy.ts
jwtFromRequest: ExtractJwt.fromExtractors([
  ExtractJwt.fromAuthHeaderAsBearerToken(), // HTTP
  req => req.handshake?.auth?.token, // WebSocket
  req => req.cookies?.access_token, // Cookie
])
```

**优先级**：Authorization Header > handshake.auth.token > Cookie

### 2. 认证逻辑统一（JwtAuthGuard）

```typescript
// src/modules/auth/guards/jwt-auth.guard.ts
async canActivate(context: ExecutionContext) {
  const contextType = context.getType()  // 'http' | 'ws'
  
  // 核心逻辑（HTTP 和 WS 完全一样）
  const token = this.extractToken(context)
  const user = this.getUser(context)
  
  // 检查黑名单
  if (await this.redis.get(authKeys.tokenBlacklist(user.jwtUuid)))
    throw new BusinessException(ERROR_CODES.AUTH_TOKEN_INVALID)
  
  // 检查密码版本
  const pv = await this.authService.getPasswordVersionByUid(user.uid)
  if (pv !== `${user.pv}`)
    throw new BusinessException(ERROR_CODES.AUTH_TOKEN_INVALID)
  
  return result
}

// 仅在获取 user 时适配
private getUser(context: ExecutionContext): AuthUser {
  return context.getType() === 'http'
    ? context.switchToHttp().getRequest().user
    : context.switchToWs().getClient().user
}
```

### 3. 权限检查统一（RbacGuard）

```typescript
// src/modules/auth/guards/rbac.guard.ts
async canActivate(context: ExecutionContext) {
  const user = this.getUser(context)  // 统一获取
  
  // 核心逻辑（HTTP 和 WS 完全一样）
  if (user.roles?.includes(Roles.ADMIN))
    return true
  
  const allPermissions = await this.authService.getPermissionsByUserId(user.uid)
  return allPermissions.includes(requiredPermission)
}
```

### 4. 异常处理统一（CatchEverythingFilter）

```typescript
// src/common/filters/catch-everything.filter.ts
catch(exception: unknown, host: ArgumentsHost) {
  const contextType = host.getType()
  
  // 提取错误信息（HTTP 和 WS 共同逻辑）
  const errorInfo = this.extractErrorInfo(exception)
  
  // 根据上下文类型响应
  if (contextType === 'http') {
    response.send(errorInfo)
  } else if (contextType === 'ws') {
    client.emit('error', errorInfo)
  }
}
```

### 5. TraceId 逻辑复用

```typescript
// src/common/middleware/trace.middleware.ts
export class TraceMiddleware {
  // 静态方法供 WebSocket 复用
  static extractTraceId(source: { headers: Record<string, string> }): string {
    return source.headers['x-trace-id']
      || source.headers['x-request-id']
      || randomUUID()
  }
}

// src/modules/websocket/interceptors/ws-trace.interceptor.ts
export class WsTraceInterceptor {
  intercept(context: ExecutionContext) {
    const client = context.switchToWs().getClient<Socket>()
    
    // 复用 TraceMiddleware 的提取逻辑
    const traceId = TraceMiddleware.extractTraceId({
      headers: client.handshake.headers
    })
    
    TraceContext.storage.run({ traceId }, () => ...)
  }
}
```

## 📊 优化效果

| 维度 | 优化前（照抄） | 优化后（复用） |
|------|---------------|---------------|
| **文件数量** | 10 个 | 6 个 |
| **JWT 逻辑** | 2 份（HTTP + WS） | 1 份 |
| **RBAC 逻辑** | 2 份（HTTP + WS） | 1 份 |
| **异常处理** | 2 份（HTTP + WS） | 1 份 |
| **维护成本** | 修改需改 2 处 | 修改只需改 1 处 |
| **逻辑一致性** | 容易分叉 | 强制一致 |

## ✅ 测试步骤

### 1. 获取 JWT Token
```bash
POST http://localhost:3000/auth/login
{
  "username": "your-username",
  "password": "your-password"
}
```

### 2. 测试 WebSocket

**方式 A：浏览器测试客户端**
```
打开 websocket-client-test.html
输入 Token 并连接
```

**方式 B：Node.js 测试客户端**
```bash
npm install socket.io-client
# 编辑 test-client.js，替换 JWT_TOKEN
node test-client.js
```

## 📚 详细文档

- **REFACTORED.md** - 详细重构说明和架构对比（推荐先看）
- **README.md** - 本文档
- **websocket-client-test.html** - 浏览器测试工具
- **test-client.js** - Node.js 测试工具

## 🎉 核心优势

1. **真正的逻辑复用** - 一套代码同时支持 HTTP 和 WebSocket
2. **最小化维护成本** - 修改认证/权限/异常逻辑只需改一处
3. **强制逻辑一致** - 不可能出现 HTTP 和 WS 的逻辑分叉
4. **简化开发** - 新增 Gateway 直接使用现有的 Guards/Filters
5. **符合 DRY 原则** - Don't Repeat Yourself

## ⚠️ 注意事项

1. **Token 传递** - 浏览器 WebSocket API 不能设置 headers，必须用 `auth.token`
2. **Guards 顺序** - 必须先 `JwtAuthGuard` 后 `RbacGuard`
3. **TraceId** - 可通过 `x-trace-id` header 传递，自动追踪
4. **异常处理** - 所有 Gateway 必须使用 `@UseFilters(CatchEverythingFilter)`

## 🔧 扩展

### 添加新的 Gateway

```typescript
@WebSocketGateway({ namespace: '/your-namespace' })
@UseGuards(JwtAuthGuard, RbacGuard) // 复用
@UseFilters(CatchEverythingFilter) // 复用
@UseInterceptors(WsTraceInterceptor) // 复用
export class YourGateway {
  // 实现你的业务逻辑
}
```

### 自定义权限

```typescript
@SubscribeMessage('custom-event')
@RequirePermissions('your:custom:permission')
handleCustomEvent() {
  // RbacGuard 自动检查权限
}
```

## 总结

这个 WebSocket 实现做到了真正的"逻辑复用"：

- ✅ JWT 验证逻辑：1 处
- ✅ RBAC 权限逻辑：1 处
- ✅ Token 黑名单检查：1 处
- ✅ 密码版本检查：1 处
- ✅ 异常处理逻辑：1 处
- ✅ TraceId 提取逻辑：1 处

**修改任何认证/权限/异常逻辑，HTTP 和 WebSocket 同时生效！**
