# 数据与缓存

## TypeORM 数据层

`DatabaseModule` 通过 `TypeOrmModule.forRootAsync()` 初始化连接，并启用 `autoLoadEntities`。业务实体继承 `CommonEntity`，统一包含：

- `id`：PostgreSQL `bigint`，应用层类型为字符串；
- `createdAt`、`updatedAt`、`deletedAt`；
- `createdBy`、`updatedBy` 审计字段；
- TypeORM `BaseEntity` Active Record 能力。

主要表包括用户、角色、菜单、用户角色、角色菜单、Refresh Token、登录日志和验证码日志。软删除由 `deleted_at` 表示。

`sys_user` 的 Vben 资料字段包含可空的 `avatar`、`home_path` 和 `description`。`/user/info` 在 DTO 边界分别映射为 `avatar`、`homePath` 和 `desc`；历史用户的 NULL 值返回空字符串。

## Redis 缓存

`CacheService` 为 Redis 提供类型化 key 与 JSON 序列化封装。`getOrSet()` 同时处理常见缓存风险：

- 使用短期空值占位避免缓存穿透；
- TTL 随机抖动降低集中失效风险；
- `SET NX EX` 分布式锁降低热点 key 击穿；
- Lua 对比锁值后原子解锁，避免误删其他请求的锁；
- `SCAN` 代替 `KEYS` 实现前缀批量删除。

缓存 key 按用途拆分在 `src/shared/cache/keys`，覆盖用户信息、用户权限、Access / Refresh Token、黑名单、密码版本与在线状态。

用户权限缓存使用 `auth:user:permissions:<userId>`，值中包含 `schemaVersion` 和 `codes`。`/auth/codes` 与 `RbacGuard` 共享同一个缓存回源入口：Redis 未命中时从角色菜单关系加载并回填，版本匹配且 `codes` 为空数组代表用户确实没有权限，不能被误判为未命中。旧版无版本数组或未知版本会惰性回源并覆盖，不要求发布时全量清 Redis；未来权限缓存结构或授权语义变化时必须递增 schema 版本。

`AuthService.invalidatePermissionsCache(userId)` 用于定向删除；菜单、角色和用户授权写服务必须在数据库事务成功提交后调用，避免回滚事务提前清除缓存或继续使用旧权限。

## 审计与日志

HTTP traceId 通过 `AsyncLocalStorage` 在请求链路中传递。登录成功后会记录 IP、User-Agent 和 IP 地址解析结果；地址解析失败不会阻断登录。TypeORM 使用自定义 Logger 输出数据库日志。

::: warning 多实例注意
缓存锁基于 Redis，可跨进程；但 WebSocket 在线会话当前仅保存在进程内存。多实例实时通信仍需 Socket.IO Redis Adapter 和共享在线状态，代码中的 Adapter 接入目前被注释。
:::
