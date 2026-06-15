# WebSocket 模块

复用 HTTP 的 JWT、RBAC、Filters、TraceId 逻辑的 WebSocket 实现。

## 快速开始

### 1. 已完成集成

WebSocket 模块已经集成到项目中，无需额外配置。

### 2. 测试步骤

#### 方式 1: 使用浏览器测试客户端（推荐）

1. 在浏览器中打开 `websocket-client-test.html`
2. 获取 JWT Token（通过登录接口）
3. 输入 Token 并连接
4. 测试各种操作

#### 方式 2: 使用 Node.js 测试客户端

```bash
# 1. 安装依赖
npm install socket.io-client

# 2. 编辑 test-client.js，替换 JWT_TOKEN

# 3. 运行测试
node test-client.js
```

#### 方式 3: 使用任意 Socket.IO 客户端

```javascript
import { io } from 'socket.io-client'

const socket = io('http://localhost:3000/chat', {
  auth: {
    token: 'your-jwt-token'
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
  console.error('Error:', error)
})
```

## 文档

- **INTEGRATION.md** - 完整的集成指南和架构说明
- **README.md** - 详细的使用文档和 API 参考
- **websocket-client-test.html** - 浏览器测试客户端
- **test-client.js** - Node.js 测试客户端

## 架构亮点

✅ **逻辑 100% 复用** - JWT、RBAC、TraceId、异常处理  
✅ **仅适配传输层** - 最小化维护成本  
✅ **生产级质量** - 完整的错误处理和日志追踪  
✅ **符合 NestJS 规范** - 官方推荐的最佳实践  

## 目录结构

```
websocket/
├── guards/              # 守卫（JWT + RBAC）
├── filters/             # 异常过滤器
├── interceptors/        # 拦截器（TraceId）
├── gateways/            # Gateway 示例
├── websocket.module.ts  # 模块定义
├── README.md            # 详细文档
├── INTEGRATION.md       # 集成指南
├── QUICKSTART.md        # 本文件
├── websocket-client-test.html  # 浏览器测试客户端
└── test-client.js       # Node.js 测试客户端
```

## 常见问题

### Q: Token 如何传递？
A: 推荐通过 `auth.token`，也支持 `headers.Authorization`

### Q: 权限控制如何使用？
A: 使用 `@RequirePermissions('system:xxx')` 装饰器，与 HTTP 一致

### Q: 如何创建公开接口？
A: 使用 `@Public()` 装饰器跳过认证

### Q: 多端登录限制生效吗？
A: 是的，与 HTTP 完全一致，在 `WsJwtGuard` 中检查

更多问题请参考 **README.md** 和 **INTEGRATION.md**
