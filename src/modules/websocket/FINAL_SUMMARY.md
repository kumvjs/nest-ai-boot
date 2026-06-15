# ✅ WebSocket 模块重构完成 - 真正的逻辑复用

## 🎯 重构成果

感谢你的指正！已将"照抄改写"的实现重构为**真正的逻辑复用**。

### 核心改进

**之前（❌ 照抄改写）**：
```
HTTP:  JwtAuthGuard     WsJwtGuard
HTTP:  RbacGuard        WsRbacGuard  
HTTP:  CatchEverythingFilter    WsExceptionFilter
```
维护成本：修改逻辑需要改 2 处

**现在（✅ 真正复用）**：
```
HTTP + WS:  JwtAuthGuard（统一）
HTTP + WS:  RbacGuard（统一）
HTTP + WS:  CatchEverythingFilter（统一）
```
维护成本：修改逻辑只需改 1 处

## 📁 文件结构

### 已删除的冗余文件
```
❌ src/modules/websocket/guards/ws-jwt.guard.ts
❌ src/modules/websocket/guards/ws-rbac.guard.ts
❌ src/modules/websocket/filters/ws-exception.filter.ts
```

### 优化后的核心文件
```
✅ src/modules/auth/guards/jwt-auth.guard.ts
   → 统一支持 HTTP + WebSocket（通过 context.getType() 适配）

✅ src/modules/auth/guards/rbac.guard.ts
   → 统一支持 HTTP + WebSocket

✅ src/modules/auth/strategies/jwt.strategy.ts
   → 统一 Token 提取（Authorization Header / handshake.auth.token）

✅ src/common/filters/catch-everything.filter.ts
   → 统一支持 HTTP + WebSocket（response.send() vs client.emit()）

✅ src/common/middleware/trace.middleware.ts
   → 提供 extractTraceId() 静态方法供 WebSocket 复用

✅ src/modules/websocket/interceptors/ws-trace.interceptor.ts
   → 复用 TraceMiddleware.extractTraceId()
```

## 🔑 核心实现

### 1. JwtStrategy - 统一 Token 提取

```typescript
// src/modules/auth/strategies/jwt.strategy.ts
jwtFromRequest: ExtractJwt.fromExtractors([
  ExtractJwt.fromAuthHeaderAsBearerToken(), // HTTP
  req => req.handshake?.auth?.token, // WebSocket（浏览器不能设置 headers）
  req => req.cookies?.access_token, // Cookie
])
```

### 2. JwtAuthGuard - 统一认证逻辑

```typescript
// src/modules/auth/guards/jwt-auth.guard.ts
async canActivate(context: ExecutionContext) {
  const contextType = context.getType()  // 'http' | 'ws'
  
  // 核心逻辑（HTTP 和 WS 完全一样）
  const token = this.extractToken(context)
  const user = this.getUser(context)
  
  // 黑名单检查
  if (await this.redis.get(authKeys.tokenBlacklist(user.jwtUuid)))
    throw new BusinessException(ERROR_CODES.AUTH_TOKEN_INVALID)
  
  // 密码版本检查
  const pv = await this.authService.getPasswordVersionByUid(user.uid)
  if (pv !== `${user.pv}`)
    throw new BusinessException(ERROR_CODES.AUTH_TOKEN_INVALID)
  
  // 多端登录检查
  if (!this.appConfig.multiDeviceLogin) {
    const cacheToken = await this.authService.getTokenByUid(user.uid)
    if (token !== cacheToken)
      throw new BusinessException(ERROR_CODES.AUTH_LOGGED_IN_ELSEWHERE)
  }
  
  return result
}

// 仅在获取 user 时根据上下文适配
private getUser(context: ExecutionContext): LoginUserContext  {
  return context.getType() === 'http'
    ? context.switchToHttp().getRequest().user
    : context.switchToWs().getClient().user
}
```

### 3. RbacGuard - 统一权限检查

```typescript
// src/modules/auth/guards/rbac.guard.ts
async canActivate(context: ExecutionContext) {
  const user = this.getUser(context)  // 统一获取
  
  // 核心逻辑（HTTP 和 WS 完全一样）
  if (user.roles?.includes(Roles.ADMIN))
    return true
  
  const allPermissions = await this.authService.getPermissionsCache(Number(user.uid))
    ?? await this.authService.getPermissionsByUserId(user.uid)
  
  let canNext = false
  if (Array.isArray(payloadPermission))
    canNext = payloadPermission.every(i => allPermissions.includes(i))
  if (typeof payloadPermission === 'string')
    canNext = allPermissions.includes(payloadPermission)
  
  if (!canNext)
    throw new BusinessException(ERROR_CODES.AUTH_UNAUTHORIZED)
  
  return true
}
```

### 4. CatchEverythingFilter - 统一异常处理

```typescript
// src/common/filters/catch-everything.filter.ts
catch(exception: unknown, host: ArgumentsHost) {
  const contextType = host.getType()
  
  // 提取错误信息（HTTP 和 WS 共同逻辑）
  const errorInfo = this.extractErrorInfo(exception)
  
  // 根据上下文类型响应
  if (contextType === 'http') {
    response.status(httpStatus).send(responseBody)
  } else if (contextType === 'ws') {
    client.emit('error', responseBody)
  }
}

// 共同逻辑：提取错误信息
private extractErrorInfo(exception: unknown) {
  // BusinessException / HttpException / WsException 统一处理
  let code = ERROR_CODES.ERROR.code
  let message = ERROR_CODES.ERROR.message
  let httpStatus = HttpStatus.INTERNAL_SERVER_ERROR
  
  if (exception instanceof BusinessException) {
    code = exception.getErrorCode()
    httpStatus = exception.getStatus()
    message = exception.message
  }
  // ... 其他异常类型
  
  return { code, message, httpStatus }
}
```

### 5. TraceId - 逻辑复用

```typescript
// src/common/middleware/trace.middleware.ts
export class TraceMiddleware {
  use(req, res, next) {
    const traceId = TraceMiddleware.extractTraceId(req)
    req.headers['x-trace-id'] = traceId
    res.setHeader('x-trace-id', traceId)
    TraceContext.storage.run({ traceId }, () => next())
  }

  // 静态方法供 WebSocket 复用
  static extractTraceId(source: { headers: Record<string, string> }): string {
    return source.headers['x-trace-id']
      || source.headers['x-request-id']
      || randomUUID()
  }
}

// src/modules/websocket/interceptors/ws-trace.interceptor.ts
export class WsTraceInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const client = context.switchToWs().getClient<Socket>()

    // 复用 TraceMiddleware 的提取逻辑
    const traceId = TraceMiddleware.extractTraceId({
      headers: client.handshake.headers
    })

    TraceContext.storage.run({ traceId }, () => next.handle().subscribe())
  }
}
```

## 🚀 使用方式

### Gateway 示例

```typescript
import { UseFilters, UseGuards, UseInterceptors } from '@nestjs/common'
import {
  ConnectedSocket,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets'
import { Socket } from 'socket.io'
import { Public } from '@/common/decorators/public.decorator'
import { CatchEverythingFilter } from '@/common/filters/catch-everything.filter'
import { RequirePermissions } from '@/modules/auth/decorators'
// 直接使用 HTTP 的 Guards 和 Filters ✅
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard'
import { RbacGuard } from '@/modules/auth/guards/rbac.guard'
import { WsTraceInterceptor } from '@/modules/websocket/interceptors/ws-trace.interceptor'

@WebSocketGateway({ namespace: '/chat' })
@UseGuards(JwtAuthGuard, RbacGuard) // 与 HTTP 完全相同 ✅
@UseFilters(CatchEverythingFilter) // 与 HTTP 完全相同 ✅
@UseInterceptors(WsTraceInterceptor)
export class ChatGateway {
  @SubscribeMessage('message')
  handleMessage(@ConnectedSocket() client: Socket) {
    const user = client.user as LoginUserContext // handleConnection 自动注入
    return { event: 'message', data: { userId: user.uid } }
  }

  @SubscribeMessage('admin-only')
  @RequirePermissions('system:admin') // 与 HTTP 完全相同 ✅
  handleAdminEvent() {
    // RbacGuard 自动检查权限
  }

  @SubscribeMessage('public')
  @Public() // 与 HTTP 完全相同 ✅
  handlePublicEvent() {
    // 无需认证
  }
}
```

### 客户端连接

```javascript
import { io } from 'socket.io-client'

const socket = io('http://localhost:3000/chat', {
  auth: {
    token: 'your-jwt-token' // JwtStrategy 自动提取
  }
})

socket.on('connect', () => {
  socket.emit('message', { content: 'Hello' })
})

socket.on('error', (error) => {
  console.error('Error:', error) // CatchEverythingFilter 自动格式化
})
```

## 📊 优化效果

| 维度 | 优化前 | 优化后 | 改进 |
|------|--------|--------|------|
| **文件数量** | 10 个 | 6 个 | -40% |
| **JWT 逻辑** | 2 份 | 1 份 | 消除重复 |
| **RBAC 逻辑** | 2 份 | 1 份 | 消除重复 |
| **异常处理** | 2 份 | 1 份 | 消除重复 |
| **维护成本** | 改 2 处 | 改 1 处 | -50% |
| **逻辑一致性** | 容易分叉 | 强制一致 | ✅ |

## ✅ 编译验证

```bash
✅ npm run build
✅ TypeScript 编译通过
✅ 所有类型检查通过
✅ 0 errors
```

## 📚 详细文档

- **REFACTORED.md** - 详细重构说明和对比（推荐阅读）
- **README.md** - 使用文档
- **websocket-client-test.html** - 浏览器测试工具
- **test-client.js** - Node.js 测试工具

## 🎉 总结

### 重构成果

1. **消除代码重复** - 删除 3 个冗余文件
2. **真正的逻辑复用** - 一套代码同时支持 HTTP 和 WebSocket
3. **维护成本降低 50%** - 修改一处，两边生效
4. **强制逻辑一致** - 不可能出现 HTTP 和 WS 的认证逻辑分叉
5. **简化开发** - 新增 Gateway 直接使用现有的 Guards/Filters

### 核心复用点

- ✅ JWT 验证逻辑：1 处
- ✅ RBAC 权限逻辑：1 处
- ✅ Token 黑名单检查：1 处
- ✅ 密码版本检查：1 处
- ✅ 多端登录检查：1 处
- ✅ 异常处理逻辑：1 处
- ✅ TraceId 提取逻辑：1 处

**现在修改任何认证/权限/异常逻辑，HTTP 和 WebSocket 自动同步！真正做到了"复用"而不是"照抄"！**
