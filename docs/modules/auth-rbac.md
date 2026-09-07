# 认证与 RBAC

## 登录与令牌

登录使用用户名和密码。密码当前以随机盐拼接后计算 MD5；成功后生成两类令牌：

- Access Token 返回给前端，由请求头 `Authorization: Bearer <token>` 携带。
- Refresh Token 写入 `refresh_token` HttpOnly Cookie，并在 PostgreSQL 与 Redis 中保留状态。

刷新令牌采用轮换机制：数据库原子删除旧 Refresh Token 是一次性消费点，只有成功删除一条记录的请求才能生成新的 Access Token 与 Refresh Token，因此旧令牌的并发请求或重放不会产生第二组令牌。退出登录会把当前 JWT UUID 加入 Redis 黑名单，清理 Access Token 状态，撤销请求 Cookie 对应的 Refresh Token，并清除浏览器 Cookie。

登录与刷新均返回统一 `ResOp`，Access Token 位于 `data.accessToken`；Vben 前端的 OpenAPI 客户端在统一拦截器中解包 `data`。`/user/info` 使用专用响应 DTO 将数据库 `id` 映射为字符串 `userId`，不会直接暴露用户实体和审计字段。

JWT 校验还会检查：

- Redis 中是否仍有 Access Token 记录；
- JWT 是否处于黑名单；
- 用户密码版本是否与缓存一致；
- 单端登录模式启用时，是否为当前有效 Token（当前配置固定允许多端登录）。

::: warning 当前安全边界
登录代码没有检查用户 `status`；图片验证码校验被注释；密码哈希使用 MD5。上线前仍需完成账号状态校验并迁移到 Argon2id / bcrypt。
:::

浏览器安全配置按环境管理：凭据 CORS 使用精确 Origin，生产要求 HTTPS 与 Secure Cookie，Cookie Domain 默认不设置，SameSite 可按同站/跨站部署选择。全局可信 Origin 守卫在 JWT 和业务逻辑之前拒绝来自非白名单 Origin 的非安全方法；没有 Origin 的 CLI/服务间调用不受影响。

## RBAC 数据模型

```text
sys_user ──< sys_user_role >── sys_role
                                  │
                                  └──< sys_role_menu >── sys_menu.permission
```

`sys_menu.permission` 可保存逗号分隔权限码。有效权限只来自启用角色关联的启用菜单或按钮；返回前会拆分、去空、去重并稳定排序。启用的 `super` 角色不要求建立逐项角色菜单关联，而是获得全部启用菜单/按钮权限码，和后端守卫的超级用户放行语义保持一致。守卫只根据启用角色关系生成的 `roleCodes` 判断 `super`，不会信任 `sys_user.role` 的旧冗余值。

用户登录时，系统按数据库最新状态查询权限并写入带 schema 版本的 Redis 缓存。后续 `/auth/codes` 与 `RbacGuard` 共用缓存回源逻辑：版本匹配的命中（包括空 `codes`）直接使用，旧版或未命中值查询 PostgreSQL 并回填。`invalidatePermissionsCache(userId)` 提供按用户失效入口；后续菜单、角色和用户授权写操作必须在事务提交后调用。`RbacGuard` 读取 `@RequirePermissions()` 元数据，数组权限使用“全部满足”语义。

```ts
@RequirePermissions('system:user:list')
@Get('list')
list() {}

@RequirePermissions('system:user:update', 'system:user:audit')
@Post('review')
review() {}
```

未标注 `@RequirePermissions()` 的已认证接口只要求有效登录，不进行细粒度权限判断。`@Public()` 可同时跳过 JWT 与 RBAC Guard。

## 当前完成度

- 用户信息、有效权限码查询和用户分页列表已有接口。
- `/auth/codes` 返回菜单/按钮 permission 数组，不返回角色 code；角色身份仍由 `/user/info.roles` 表达。
- 角色、菜单实体、权限查询服务和按用户缓存失效入口已经存在。
- 角色和菜单 Controller 尚无 CRUD 路由。
- DTO 已预留，但用户、角色、菜单完整管理流程尚未实现。
- 权限写接口尚未实现；后续实现必须在数据库事务提交后失效受影响用户的权限缓存。
