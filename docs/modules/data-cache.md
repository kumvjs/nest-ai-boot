# 数据与缓存

## TypeORM 数据层

`DatabaseModule` 通过 `TypeOrmModule.forRootAsync()` 初始化连接，并启用 `autoLoadEntities`。业务实体继承 `CommonEntity`，统一包含：

- `id`：PostgreSQL `bigint`，应用层类型为字符串；
- `createdAt`、`updatedAt`、`deletedAt`；
- `createdBy`、`updatedBy` 审计字段；
- TypeORM `BaseEntity` Active Record 能力。

主要表包括用户、角色、菜单、用户角色、角色菜单、Refresh Token、登录日志和验证码日志。软删除由 `deleted_at` 表示。

## Redis 缓存

`CacheService` 为 Redis 提供类型化 key 与 JSON 序列化封装。`getOrSet()` 同时处理常见缓存风险：

- 使用短期空值占位避免缓存穿透；
- TTL 随机抖动降低集中失效风险；
- `SET NX EX` 分布式锁降低热点 key 击穿；
- Lua 对比锁值后原子解锁，避免误删其他请求的锁；
- `SCAN` 代替 `KEYS` 实现前缀批量删除。

缓存 key 按用途拆分在 `src/shared/cache/keys`，覆盖用户信息、用户权限、Access / Refresh Token、黑名单、密码版本与在线状态。

## 审计与日志

HTTP traceId 通过 `AsyncLocalStorage` 在请求链路中传递。登录成功后会记录 IP、User-Agent 和 IP 地址解析结果；地址解析失败不会阻断登录。TypeORM 使用自定义 Logger 输出数据库日志。

::: warning 多实例注意
缓存锁基于 Redis，可跨进程；但 WebSocket 在线会话当前仅保存在进程内存。多实例实时通信仍需 Socket.IO Redis Adapter 和共享在线状态，代码中的 Adapter 接入目前被注释。
:::
