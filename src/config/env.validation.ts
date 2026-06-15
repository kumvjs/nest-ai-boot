import * as Joi from 'joi'
/**
 * Database type.
 */
export const DATABASE_TYPES = [
  'aurora-mysql',
  'aurora-postgres',
  'better-sqlite3',
  'capacitor',
  'cockroachdb',
  'cordova',
  'expo',
  'mariadb',
  'mongodb',
  'mssql',
  'mysql',
  'nativescript',
  'oracle',
  'postgres',
  'react-native',
  'sap',
  'spanner',
  'sqljs',
] as const
export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'local')
    .default('development'),

  JWT_SECRET: Joi.string().required(),

  TYPEORM_TYPE: Joi.string().valid(...DATABASE_TYPES).required(),
  TYPEORM_HOST: Joi.string().required(),
  TYPEORM_PORT: Joi.number().required(),
  TYPEORM_USERNAME: Joi.string().required(),
  TYPEORM_PASSWORD: Joi.string().required(),
  TYPEORM_DATABASE: Joi.string().required(),
  TYPEORM_SYNCHRONIZE: Joi.boolean().default(false),

  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.number().required(),
  REDIS_PASSWORD: Joi.string().allow('').optional(),
  REDIS_DB: Joi.number().default(0),

  LOGGER_LOG_LEVELS: Joi.string().empty('')
    .custom((value, helpers) => {
      const levels = value
        .split(',')
        .map(v => v.trim())
        .filter(Boolean)

      const allowed = ['verbose', 'debug', 'log', 'warn', 'error', 'fatal']

      for (const level of levels) {
        if (!allowed.includes(level)) {
          return helpers.error('any.invalid')
        }
      }

      return levels
    })
    .optional(),
  LOGGER_TIMESTAMP: Joi.boolean().empty('').optional(),
  LOGGER_PREFIX: Joi.string().allow('').optional(),
  LOGGER_JSON: Joi.boolean().empty('').optional(),
  LOGGER_COLORS: Joi.boolean().empty('').optional(),
  LOGGER_COMPACT: Joi.boolean().empty('').optional(),
  LOGGER_DEPTH: Joi.number().empty('').optional(),
})
