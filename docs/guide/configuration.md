# 配置说明

配置由 `@nestjs/config` 加载，顺序为 `.env.<NODE_ENV>`、`.env`；前者优先。Joi 在启动时校验数据库、Redis 与 JWT 等必需项。

## 应用与接口

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `NODE_ENV` | `development` | 可选 `development`、`production`、`local` |
| `APP_NAME` | 无 | Swagger 标题等场景使用 |
| `APP_PORT` | `3000` | HTTP 监听端口 |
| `APP_BASE_URL` | 无 | 对外服务地址 |
| `GLOBAL_PREFIX` | `api` | 全局 API 前缀 |
| `APP_LOCALE` | `zh-CN` | 应用语言配置，目前未接入 i18n |
| `SWAGGER_ENABLE` | `false` | 是否启用 Swagger |
| `SWAGGER_PATH` | 无 | Swagger 路径，例如 `api-docs` |
| `SWAGGER_SERVER_URL` | `APP_BASE_URL` | OpenAPI Server 地址 |

## PostgreSQL / TypeORM

| 变量 | 说明 |
| --- | --- |
| `TYPEORM_TYPE` | 本项目目标为 `postgres`，校验器也允许其他 TypeORM 驱动 |
| `TYPEORM_HOST` / `TYPEORM_PORT` | 数据库地址与端口 |
| `TYPEORM_USERNAME` / `TYPEORM_PASSWORD` | 数据库凭据 |
| `TYPEORM_DATABASE` / `TYPEORM_SCHEMA` | 数据库与 Schema |
| `TYPEORM_SYNCHRONIZE` | 是否自动同步实体；生产环境必须为 `false` |
| `DB_LOGGING` | TypeORM 日志选项，可传 JSON 数组等 TypeORM 支持值 |

## Redis 与令牌

| 变量 | 说明 |
| --- | --- |
| `REDIS_HOST` / `REDIS_PORT` | Redis 地址与端口 |
| `REDIS_PASSWORD` | Redis 密码，可为空 |
| `REDIS_DB` | Redis DB 编号，默认 `0` |
| `JWT_SECRET` | Access Token 签名密钥，必填 |
| `JWT_EXPIRE` | Access Token 有效秒数 |
| `REFRESH_TOKEN_SECRET` | Refresh Token 独立签名密钥 |
| `REFRESH_TOKEN_EXPIRE` | Refresh Token 有效秒数 |

## 日志

`LOGGER_LOG_LEVELS` 接收逗号分隔的 Nest 日志级别；`LOGGER_JSON`、`LOGGER_COLORS`、`LOGGER_TIMESTAMP`、`LOGGER_COMPACT`、`LOGGER_PREFIX` 和 `LOGGER_DEPTH` 控制控制台日志格式。

::: tip 配置现状
`multiDeviceLogin` 当前在 `app.config.ts` 中固定为 `true`，尚不能通过环境变量切换。Fastify cookie 签名 secret 也仍是代码常量，后续应移入安全配置。
:::
