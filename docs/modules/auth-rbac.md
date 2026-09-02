# 认证与 RBAC

## 登录与令牌

登录使用用户名和密码。密码当前以随机盐拼接后计算 MD5；成功后生成两类令牌：

- Access Token 返回给前端，由请求头 `Authorization: Bearer <token>` 携带。
- Refresh Token 写入 `refresh_token` HttpOnly Cookie，并在 PostgreSQL 与 Redis 中保留状态。

刷新令牌采用轮换机制：旧 Refresh Token 被删除，再生成新的 Access Token 与 Refresh Token。退出登录会把当前 JWT UUID 加入 Redis 黑名单，并清理关联登录态。

JWT 校验还会检查：

- Redis 中是否仍有 Access Token 记录；
- JWT 是否处于黑名单；
- 用户密码版本是否与缓存一致；
- 单端登录模式启用时，是否为当前有效 Token（当前配置固定允许多端登录）。

::: warning 当前安全边界
登录代码没有检查用户 `status`；图片验证码校验被注释；密码哈希使用 MD5；Cookie 固定 `secure: true` 与 `sameSite: strict`。上线前应完成账号状态校验，改用 Argon2 / bcrypt，并按部署域名设计 Cookie 与 CSRF 策略。
:::

## RBAC 数据模型

```text
sys_user ──< sys_user_role >── sys_role
                                  │
                                  └──< sys_role_menu >── sys_menu.permission
```

`sys_menu.permission` 可保存逗号分隔权限码。用户登录时，系统按角色查询权限并写入 Redis。`RbacGuard` 读取 `@RequirePermissions()` 元数据；数组权限使用“全部满足”语义。`super` 用户绕过权限码检查。

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

- 用户信息、角色码查询和用户分页列表已有接口。
- 角色、菜单实体与权限查询服务已经存在。
- 角色和菜单 Controller 尚无 CRUD 路由。
- DTO 已预留，但用户、角色、菜单完整管理流程尚未实现。
- `/auth/codes` 实际返回 `roleCodes`，不是菜单 permission 列表；Vben 对接时需按前端语义确认。
