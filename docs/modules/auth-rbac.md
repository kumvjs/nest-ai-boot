# 认证与 RBAC

## 登录与令牌

登录使用用户名和密码。密码当前以随机盐拼接后计算 MD5；只有密码正确且 `sys_user.status=true` 才会生成两类令牌。未知账号和密码错误始终返回相同凭据错误，停用状态只在该账号密码已经验证后返回，减少账号状态枚举。

- Access Token 返回给前端，由请求头 `Authorization: Bearer <token>` 携带。
- Refresh Token 写入 `refresh_token` HttpOnly Cookie，并在 PostgreSQL 与 Redis 中保留状态。

刷新令牌采用轮换机制：数据库原子删除旧 Refresh Token 是一次性消费点，只有成功删除一条记录的请求才能生成新的 Access Token 与 Refresh Token，因此旧令牌的并发请求或重放不会产生第二组令牌。退出登录会把当前 JWT UUID 加入 Redis 黑名单，清理 Access Token 状态，撤销请求 Cookie 对应的 Refresh Token，并清除浏览器 Cookie。

登录与刷新均返回统一 `ResOp`，Access Token 位于 `data.accessToken`；Vben 前端的 OpenAPI 客户端在统一拦截器中解包 `data`。`/user/info` 使用专用响应 DTO 将数据库 `id` 映射为字符串 `userId`，不会直接暴露用户实体和审计字段。

当前状态校验覆盖新登录。未来 M5 实现账号停用写操作时，还必须在同一业务流程中撤销该用户已有会话并清理用户/权限缓存；仅由运维直接修改数据库状态不会自动撤销已经签发的 Token。

JWT 校验还会检查：

- Redis 中是否仍有 Access Token 记录；
- JWT 是否处于黑名单；
- 用户密码版本是否与缓存一致；
- 单端登录模式启用时，是否为当前有效 Token（当前配置固定允许多端登录）。

::: warning 当前安全边界
图片验证码校验仍被注释；密码哈希仍使用快速 MD5。新建/重置密码功能在迁移到 Argon2id 前不得照搬当前 `encryptPassword()`。
:::

浏览器安全配置按环境管理：凭据 CORS 使用精确 Origin，生产要求 HTTPS 与 Secure Cookie，Cookie Domain 默认不设置，SameSite 可按同站/跨站部署选择。全局可信 Origin 守卫在 JWT 和业务逻辑之前拒绝来自非白名单 Origin 的非安全方法；没有 Origin 的 CLI/服务间调用不受影响。

## 密码哈希迁移计划

目标算法为 Argon2id。具体内存、迭代和并行参数不能只按开发机拍脑袋设置：M5 引入依赖时，应在生产同等级硬件上基准测试，并至少满足届时的 [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html) 建议。bcrypt 仅作为运行环境无法使用 Argon2id 时的评审后备选项。

迁移必须支持一段时间内混合哈希，而不是试图离线“解密”MD5：

1. 可逆迁移增加算法标记，现有行标记为 `legacy-md5`；现代哈希使用包含算法、salt 和参数的 PHC 字符串，双验证器准备好后才允许旧 `psalt` 为空。
2. 新建用户和密码重置只生成 Argon2id。遗留用户密码验证成功后，在签发 Token 前直接用本次提交的明文密码生成 Argon2id，并以事务和并发保护替换旧值。
3. 升级/重置密码同时递增持久化密码版本并撤销其他会话，避免缓存中固定版本号破坏强制重新登录语义。
4. 只记录算法分布等聚合指标，不记录密码、salt 或哈希。超过批准期限仍未登录的遗留账号强制走安全重置。
5. 发布窗口内保留混合验证与回滚能力；达到审核后的迁移比例并处理剩余账号后，再删除 MD5 验证分支和 `psalt`。

不能把 `argon2(md5(password))` 当成最终迁移结果；这种包裹方式没有获得直接 Argon2id 哈希明文密码的完整安全属性。也不能批量改写现有哈希，因为服务端并不知道用户原密码。

## RBAC 数据模型

```text
sys_user ──< sys_user_role >── sys_role
                                  │
                                  └──< sys_role_menu >── sys_menu.auth_code
```

`sys_menu.auth_code` 是 Vben 的 `authCode` 持久化列，每行只保存一个权限码。查询会去空、去重并稳定排序；角色关联产生的重复行优先在 PostgreSQL 中去重。有效权限只来自启用角色关联的启用菜单或按钮。启用的 `super` 角色不要求建立逐项角色菜单关联，而是获得全部启用菜单/按钮权限码，和后端守卫的超级用户放行语义保持一致。守卫只根据启用角色关系生成的 `roleCodes` 判断 `super`，不会信任 `sys_user.role` 的旧冗余值。

用户登录时，系统按数据库最新状态查询权限并写入带 schema 版本的 Redis 缓存。后续 `/auth/codes` 与 `RbacGuard` 共用缓存回源逻辑：版本匹配的命中（包括空 `codes`）直接使用，旧版或未命中值查询 PostgreSQL 并回填。`invalidatePermissionsCache(userId)` 提供按用户失效入口；后续菜单、角色和用户授权写操作必须在事务提交后调用。`RbacGuard` 读取 `@RequirePermissions()` 元数据，数组权限使用“全部满足”语义。

## 菜单持久化模型

`sys_menu` 作为新表按 Vben 语义直接建模，只保留 `pid`、`name`、`path`、`auth_code`、`type`、`component`、`redirect`、`meta` 和 `status`，并通过 bigint `pid` 自关联。`type` 使用 Vben v5.7.0 的五个字符串值：`catalog`、`menu`、`embedded`、`link`、`button`；`status` 直接保存 Vben 使用的 smallint `0 | 1`。Bigint ID 在 API 边界始终保持字符串。

图标、排序、缓存、显隐、徽标、外链与 iframe 等前端路由展示配置存入 PostgreSQL JSONB `meta`。这样新增 Vben 元数据不会反复改表；只有需要唯一约束、索引、关系或后端业务查询的字段才提升为普通列。`name`、非空 `path` 和非空 `auth_code` 由唯一索引兜住并发写入，父菜单删除使用 `RESTRICT`。

本次明确不迁移旧菜单数据，也不保留旧数字类型、逗号权限码或外链字段兼容层。使用方需要通过项目的数据库初始化流程重新创建 `sys_menu` 及其角色菜单关联数据；该操作会丢弃旧菜单配置，执行实际删表/重建前必须由部署人员确认并备份。本代码变更不会主动操作任何数据库。

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
- `/auth/codes` 返回菜单/按钮 `authCode` 数组，不返回角色 code；角色身份仍由 `/user/info.roles` 表达。
- `/menu/all` 从启用角色映射生成动态路由树，补齐授权节点的有效祖先；超级角色获得全部有效路由。
- `/system/menu/list` 使用 `system:menu:list` 保护，返回包括按钮和停用项在内的完整管理树。
- 菜单实体已采用 Vben 五类型、JSONB 元数据、numeric 状态与 bigint `pid` 自关联；权限查询服务和按用户缓存失效入口已经存在。
- 角色和系统菜单 Controller 尚无 CRUD 路由。
- 菜单 Swagger DTO 已接入两个只读路由；用户、角色、菜单完整管理流程尚未实现。
- 权限写接口尚未实现；后续实现必须在数据库事务提交后失效受影响用户的权限缓存。
