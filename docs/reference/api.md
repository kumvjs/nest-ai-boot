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
| `POST` | `/system/menu` | JWT + `system:menu:create` | 新增并校验 Vben 五类型菜单，返回 boolean |
| `PUT` | `/system/menu/:id` | JWT + `system:menu:update` | 修改菜单并校验父子关系，返回 boolean |
| `DELETE` | `/system/menu/:id` | JWT + `system:menu:delete` | 软删除无子节点且未被角色引用的菜单，返回 boolean |
| `GET` | `/system/dept/list` | JWT + `system:dept:list` | 返回包含停用项的完整部门树 |
| `POST` | `/system/dept` | JWT + `system:dept:create` | 新增部门，返回 boolean |
| `PUT` | `/system/dept/:id` | JWT + `system:dept:update` | 修改部门及其父级、排序和状态，返回 boolean |
| `DELETE` | `/system/dept/:id` | JWT + `system:dept:delete` | 软删除无子部门且无用户引用的部门，返回 boolean |
| `GET` | `/user/info` | JWT | 返回专用 DTO：`userId`、`username`、`realName`、`avatar`、`homePath`、`desc` 与角色数组 |
| `GET` | `/system/user/list` | JWT | 分页查询系统用户，支持按 `id`、`nickname` 排序 |

`RoleController`、`AiController` 和 `CacheController` 当前没有路由，不能作为可用 API。菜单模块已发布运行时 `/menu/all` 以及完整的菜单管理读写路径。

## 动态菜单

```http
GET /api/menu/all
Authorization: Bearer eyJ...
```

普通用户通过启用角色与 `sys_role_menu` 获得菜单；超级角色不要求逐项映射。响应排除按钮、禁用记录以及无完整有效父链的记录，并递归按 `meta.order`、`name` 排序。返回业务数据只包含 Vben 路由字段，例如 `name`、`path`、`component`、`redirect`、`meta` 和 `children`，位于统一响应的 `data` 字段。

## 系统菜单列表

`GET /api/system/menu/list` 需要 `system:menu:list` 权限，`super` 角色由全局 RBAC Guard 放行。接口返回所有未软删除记录，包括按钮和 `status=0` 的停用菜单；不会返回审计列或实体关系。Bigint `id`/`pid` 保持字符串，树按 `meta.order`、`name` 递归排序。为兼容 v5.7.0 编辑表单，`meta.activePath` 同时作为顶层 `activePath` 返回，但数据库不增加重复列。

同一权限还保护 `GET /api/system/menu/name-exists?name=...&id=...` 和 `GET /api/system/menu/path-exists?path=...&id=...`。`id` 可省略；编辑时传入正整数 bigint 字符串会排除当前记录。响应的 `data` 为 boolean，比较规则与当前大小写敏感的有效记录唯一索引一致。软删除记录不参与检查，相应部分唯一索引也允许后续复用其值。

`POST /api/system/menu`、`PUT /api/system/menu/:id` 和 `DELETE /api/system/menu/:id` 分别要求 create/update/delete 权限，成功时统一返回 `ResOp<boolean>`。所有类型都要求 `meta.title`；catalog/menu/embedded 要求本地 `path`，menu 还要求安全的组件标识，embedded/link 要求不含用户凭据的 HTTP(S) 地址，button 要求父级和冒号分段的 `authCode`。顶层 `activePath`、`linkSrc` 会归入 JSONB `meta`。父级只能是 catalog/menu；写服务在可串行化事务中拒绝无效父级、自引用、后代回挂和已有子节点的叶子类型转换，并把数据库唯一键或并发竞争转换成 HTTP 409。

删除使用软删除。只要仍有未软删除的子菜单或 `sys_role_menu` 引用，就会返回 HTTP 409；不会级联删除或自动改写角色权限。

写事务提交后，系统会定向失效受该菜单角色映射影响的用户以及启用 super 角色用户的权限码缓存；创建尚无普通角色映射，只需失效 super 用户。Redis 失效不使用全量键扫描。

## 部门管理

`GET /api/system/dept/list` 返回全部未软删除部门，包括 `status=0` 的停用项。Bigint `id`/`pid` 保持字符串，`created_at` 映射为 `createTime`；树在每一级依次按 `order`、`name`、`id` 排序。缺失父级、自指或历史循环数据会在响应投影中安全归根，保证每条记录恰好出现一次且 JSON 不成环。

`POST /api/system/dept`、`PUT /api/system/dept/:id`、`DELETE /api/system/dept/:id` 分别要求 `system:dept:create`、`system:dept:update`、`system:dept:delete`，成功响应统一为 `ResOp<boolean>`。请求字段沿用 Vben 的 `name`、`pid`、`status`、`remark`，并增加可选非负整数 `order`（默认 `0`，数值越小越靠前）。状态只接受数值 `0 | 1`。

写操作在可串行化事务中执行，完整父链会被校验和锁定；不存在的父级、自引用、挂到后代以及同级活动部门重名会被拒绝。删除使用软删除，只允许删除没有活动子部门、且没有任何现存或软删除用户引用的叶子部门。停用部门只修改该部门本身，不级联停用子部门或用户。

本批次仅提供 TypeORM 映射和业务逻辑，不生成或执行迁移。部署方需要按 `SysDeptEntity` 创建 `sys_dept`，并为 `sys_user` 增加 nullable、indexed、`RESTRICT` 的 `dept_id` 外键。

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
