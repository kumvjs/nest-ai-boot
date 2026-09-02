# AI Agents

## 当前状态：规划中

项目定位包含 AI Agents 与多 Agent 协作，但当前代码尚未实现 Agent 业务。`AiModule` 已被 `AppModule` 加载，不过 `AiController` 没有任何路由，`AiEntity` 和创建 / 更新 DTO 也只有空骨架。

`AiService` 目前唯一实质能力是对 OpenAI SDK 的 `chat.completions.create()` 做了类型重载封装，支持流式与非流式返回。客户端暂时硬编码了占位 API Key 和 DashScope OpenAI 兼容地址，因此不能视为可部署实现。

## 已有基础可复用点

- OpenAI 兼容 SDK 与流式类型；
- `parse-ai-content` JSON 内容解析工具；
- PostgreSQL / TypeORM 持久化底座；
- Redis 缓存与分布式锁；
- Socket.IO 推送基础设施；
- JWT / RBAC 与 traceId 链路。

## 建议开发边界

建议按以下层次推进，避免把模型厂商调用与 Agent 业务耦合在 Controller 中：

```text
AI API / WebSocket
  → Agent Application Service
    → Orchestrator / Workflow
      ├─ Model Provider Adapter
      ├─ Tool Registry & Executor
      ├─ Memory / Conversation Store
      └─ Event Stream
```

优先补齐的能力：

1. 将 API Key、Base URL、模型名和超时移入配置并进行环境校验。
2. 定义会话、消息、Agent、任务、运行记录与工具调用的数据模型。
3. 设计单 Agent 执行状态机，再扩展 supervisor / handoff 等多 Agent 编排。
4. 为工具执行增加 schema 校验、权限、超时、重试、幂等与审计。
5. 明确 SSE 与 Socket.IO 的流式事件协议，以及取消、断线恢复和背压策略。
6. 使用 RBAC 隔离 Agent、知识库、工具和运行记录。

::: danger 不应直接上线
当前硬编码的 `apiKey` 是占位字符串，未实现请求鉴权之外的 AI 资源授权、用量限制、内容安全、调用审计或成本控制。
:::
