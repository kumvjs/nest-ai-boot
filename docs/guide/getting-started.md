# 快速开始

## 环境要求

- Node.js 20 或更高版本（建议使用当前 LTS）
- pnpm
- PostgreSQL
- Redis

## 安装与配置

```bash
pnpm install
```

复制 `.env.example` 为 `.env.local`，至少填写 PostgreSQL、Redis、`JWT_SECRET` 和 `REFRESH_TOKEN_SECRET`。本地启动脚本会设置 `NODE_ENV=local`，因此优先读取 `.env.local`。

::: warning 不要提交密钥
`.env.local` 已被 Git 忽略。生产环境应由密钥管理系统注入配置，不要沿用示例值。
:::

## 准备数据库

先构建代码，再生成和运行迁移。执行 TypeORM CLI：

```bash
pnpm build
pnpm migration:generate
pnpm migration:run
```

当前仓库中的 `1780416958755-initData.ts` 是空迁移，不能独立创建全部表。首次使用时需要根据实体生成迁移；生产环境不要启用 `TYPEORM_SYNCHRONIZE`。

## 初始化超级管理员

初始化脚本会以交互方式创建 `super` 角色和首个管理员，同时重写 `.env.local` 中的 JWT 与 Refresh Token 密钥。它要求数据库表已经存在。

```bash
pnpm setup
```

## 启动

```bash
# 本地环境，读取 .env.local
pnpm start:local

# 开发环境，读取 .env.development（不存在时回退 .env）
pnpm start:dev

# 构建后运行
pnpm build
pnpm start:prod
```

按示例配置，服务地址为 `http://localhost:7001`，业务 API 默认位于 `/api`。若启用 Swagger，界面默认位于 `http://localhost:7001/api-docs`。

## 启动文档站

```bash
pnpm docs:dev
```

生产构建与本地预览：

```bash
pnpm docs:build
pnpm docs:preview
```
