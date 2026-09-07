# HTTP API

以下列表来自当前 Controller 实现。默认全局前缀为 `/api`；表中路径省略此前缀。

## 已实现接口

| 方法 | 路径 | 鉴权 | 功能 |
| --- | --- | --- | --- |
| `POST` | `/auth/login` | 公开 | 用户名密码登录，返回 Access Token 并设置 Refresh Token Cookie |
| `POST` | `/auth/refresh` | 公开 | 从 Cookie 读取并轮换 Refresh Token |
| `POST` | `/auth/logout` | JWT | 注销当前 Access Token，并撤销和清除请求中的 Refresh Token |
| `GET` | `/auth/codes` | JWT | 返回当前用户有效的菜单/按钮 `authCode` 数组 |
| `GET` | `/menu/all` | JWT | 按启用角色授权返回 Vben 动态路由树，并补齐有效父路由 |
| `GET` | `/system/menu/list` | JWT + `system:menu:list` | 返回包含按钮和停用项的完整菜单管理树 |
| `GET` | `/system/menu/name-exists` | JWT + `system:menu:list` | 检查菜单名称是否重复，可排除正在编辑的菜单 ID |
| `GET` | `/system/menu/path-exists` | JWT + `system:menu:list` | 检查菜单路径是否重复，可排除正在编辑的菜单 ID |
| `GET` | `/user/info` | JWT | 返回专用 DTO：`userId`、`username`、`realName`、`avatar`、`homePath`、`desc` 与角色数组 |
| `GET` | `/system/user/list` | JWT | 分页查询系统用户，支持按 `id`、`nickname` 排序 |

`RoleController`、`AiController` 和 `CacheController` 当前没有路由，不能作为可用 API。菜单模块已发布运行时 `/menu/all`、只读管理树和名称/路径存在性检查；菜单 CRUD 尚未发布。

## 动态菜单

```http
GET /api/menu/all
Authorization: Bearer eyJ...
```

普通用户通过启用角色与 `sys_role_menu` 获得菜单；超级角色不要求逐项映射。响应排除按钮、禁用记录以及无完整有效父链的记录，并递归按 `meta.order`、`name` 排序。返回业务数据只包含 Vben 路由字段，例如 `name`、`path`、`component`、`redirect`、`meta` 和 `children`，位于统一响应的 `data` 字段。

## 系统菜单列表

`GET /api/system/menu/list` 需要 `system:menu:list` 权限，`super` 角色由全局 RBAC Guard 放行。接口返回所有未软删除记录，包括按钮和 `status=0` 的停用菜单；不会返回审计列或实体关系。Bigint `id`/`pid` 保持字符串，树按 `meta.order`、`name` 递归排序。为兼容 v5.7.0 编辑表单，`meta.activePath` 同时作为顶层 `activePath` 返回，但数据库不增加重复列。

同一权限还保护 `GET /api/system/menu/name-exists?name=...&id=...` 和 `GET /api/system/menu/path-exists?path=...&id=...`。`id` 可省略；编辑时传入正整数 bigint 字符串会排除当前记录。响应的 `data` 为 boolean，比较规则与当前大小写敏感的有效记录唯一索引一致。软删除记录不参与检查，相应部分唯一索引也允许后续复用其值。

## 登录

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "your-password"
}
```

成功业务数据：

```json
{
  "accessToken": "eyJ..."
}
```

该对象位于统一响应的 `data` 字段。用户名至少 4 个字符，密码至少 6 个字符；初始化脚本要求超级管理员密码至少 8 个字符。

只有启用用户可以登录。未知账号或密码错误使用同一个凭据错误；账号存在、密码正确但状态已停用时返回 `USER_ACCOUNT_DISABLED`，且不会签发 Token、写入登录缓存或记录成功登录日志。

`/auth/refresh` 同样保持统一 `ResOp` 响应，新的 Access Token 位于 `data.accessToken`。前端生成的 OpenAPI 客户端负责统一解包 `data`，后端不会为 Vben mock 的裸字符串响应增加例外。

## 用户列表分页

`nestjs-paginate` 负责解析 `/system/user/list` 查询参数。常用参数包括 `page`、`limit`、`sortBy`；实际格式以项目所用 `nestjs-paginate` 版本和 Swagger 输出为准。

```http
GET /api/system/user/list?page=1&limit=10&sortBy=nickname:ASC
Authorization: Bearer eyJ...
```

## Swagger

当 `SWAGGER_ENABLE=true` 时：

- UI：`/<SWAGGER_PATH>`，示例为 `/api-docs`；
- JSON：`/<SWAGGER_PATH>/json`；
- OpenAPI Server URL 指向 `/<GLOBAL_PREFIX>`。

WebSocket Swagger 的初始化在 `main.ts` 中被注释，目前不会暴露 `/ws-docs`。
