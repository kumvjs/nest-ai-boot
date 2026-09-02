# WebSocket 模块

该模块封装 Socket.IO 实时通信的公共能力，核心思路是让 HTTP 与 WebSocket 复用 JWT、RBAC、异常格式和 traceId。当前仓库没有注册具体业务 Gateway，因此还没有可供前端直接连接的 `/chat`、`/live-room` 或业务事件。

本页由原 `src/modules/websocket` 下多份阶段性说明精简合并，并按当前代码校正。

## 组成

| 组件 | 职责 |
| --- | --- |
| `BaseRbacGateway` | Gateway 生命周期、握手认证、用户会话登记、加入/离开房间与房间查询 |
| `WsSessionService` | 维护 `namespace → user key → Set<Socket>` 内存索引，支持同一用户多连接 |
| `WsServerService` | 保存每个命名空间的 Socket.IO `Namespace` 实例 |
| `WsPushService` | 向命名空间、房间或用户推送统一格式消息 |
| `WsInterceptor` | 为每条消息建立 trace 上下文，将 handler 返回值转换为 emit |
| `CatchEverythingFilter` | 捕获 WS 异常并通过 `error` 事件返回统一错误结构 |

预定义命名空间类型为 `chat` 与 `live-room`，但常量并不会自动创建 Gateway。

## 连接认证

客户端应通过 Socket.IO 的 `auth.token` 发送 Access Token：

```ts
import { io } from 'socket.io-client'

const socket = io('http://localhost:7001/chat', {
  auth: { token: accessToken },
})

socket.on('error', error => console.error(error))
```

`BaseRbacGateway.handleConnection()` 在握手阶段调用 `TokenService.verifyAccessToken()`，并把登录上下文保存到 `client.user`。消息到达 handler 时，全局认证逻辑还会检查黑名单、密码版本与登录态。

::: warning 当前实现约束
基类握手只读取 `client.handshake.auth.token`。虽然消息 Guard 还能从 `Authorization` header 取 Token，但基于当前基类的 Gateway 不能仅依赖 header 完成连接。无 Token 或无效 Token 会在验证处抛错；连接阶段的异常关闭行为应在业务 Gateway 接入时补充验证。
:::

## 新增业务 Gateway

下面是符合现有返回约定的最小示意。Gateway 必须作为 provider 注册；同时其模块必须能注入 `TokenService`、`WsSessionService` 和 `WsServerService`。

```ts
import type { Namespace, Socket } from 'socket.io'
import { Logger } from '@nestjs/common'
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets'
import { RequirePermissions } from '#/modules/auth/decorators/index.js'
import { TokenService } from '#/modules/auth/services/token.service.js'
import { BaseRbacGateway } from '../gateways/base.gateway.js'
import { WsServerService } from '../ws-server/ws-server.service.js'
import { WsSessionService } from '../ws-session/ws-session.service.js'

@WebSocketGateway({ namespace: '/chat', cors: { origin: true, credentials: true } })
export class ChatGateway extends BaseRbacGateway {
  protected readonly logger = new Logger(ChatGateway.name)

  @WebSocketServer()
  server: Namespace

  constructor(
    sessions: WsSessionService,
    servers: WsServerService,
    tokens: TokenService,
  ) {
    super('chat', sessions, servers, tokens)
  }

  @SubscribeMessage('message:send')
  @RequirePermissions('chat:message:send')
  send(@ConnectedSocket() client: Socket, @MessageBody() body: { content: string }) {
    return {
      event: 'message:sent',
      data: { content: body.content, userId: client.user.uid },
    }
  }
}
```

`WsInterceptor` 要求 handler 返回 `{ event, data }`。它会执行 `client.emit(event, WsResOp.success(data))`，然后返回 `null`，避免 Nest 再发送一次原始结果。

## 推送与房间

```ts
// 广播到整个命名空间
push.emitToNamespace('chat', 'event', payload)

// 广播到房间；使用统一 key 生成器
const roomKey = wsRoomKeyGen(roomId)
push.emitToRoom('chat', roomKey, 'event', payload)

// 定向推送到用户
push.emitToUser('chat', wsUidKeys.user(userId), 'event', payload)
```

注意：`WsPushService.emitToUser()` 参数名叫 `userId`，但当前会话登记使用的是 `wsUid:user:<id>`。调用方必须传生成后的 user key，否则无法命中会话。

## 响应格式

成功事件基本和 HTTP 响应一致：

```json
{
  "code": 0,
  "data": { "content": "hello" },
  "message": "success",
  "success": true,
  "traceId": ""
}
```

异常统一通过 `error` 事件发送 `ResOp.error()`。目前 `WsResOp.success()` 创建响应时没有显式把本条消息的 traceId 传入，但会从 `AsyncLocalStorage` 读取当前上下文。

## 上线前检查

- 注册至少一个具体 Gateway，并确保依赖模块可见。
- 为业务事件扩展 `WsEvent` 联合类型；当前只允许字面量 `event`。
- 统一 `emitToUser` 的参数语义，避免原始用户 ID 与会话 key 混用。
- 根据前端域名配置 Socket.IO CORS。
- 多实例部署时启用 Socket.IO Redis Adapter；当前 `main.ts` 中相关代码被注释，且尚无 Adapter 实现接线。
