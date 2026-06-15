import cluster from 'node:cluster'
import { APP_CONFIG } from './app.config'
import { databaseConfig } from './database.config'
import { REDIS_CONFIG } from './redis.config'
import { securityConfig } from './security.config'
import { SWAGGER_CONFIG } from './swagger.config'

export * from './app.config'
export * from './database.config'
export * from './security.config'

export const isMainCluster
  = process.env.NODE_APP_INSTANCE && Number.parseInt(process.env.NODE_APP_INSTANCE) === 0
export const isMainProcess = cluster.isPrimary || isMainCluster

export const isDev = process.env.NODE_ENV === 'development'
export const isProd = process.env.NODE_ENV === 'production'

export default { APP_CONFIG, databaseConfig, securityConfig, REDIS_CONFIG, SWAGGER_CONFIG }
