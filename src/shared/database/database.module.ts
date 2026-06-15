import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { DataSource, LoggerOptions } from 'typeorm'
import { DatabaseConfig } from '@/config'
import { databaseConfig } from '@/config/database.config'
import { TypeORMLogger } from './typeorm-logger'

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [databaseConfig.KEY],
      useFactory: (db: DatabaseConfig) => {
        let loggerOptions: LoggerOptions = process.env.DB_LOGGING as 'all'

        try {
          // 解析成 js 数组 ['error']
          loggerOptions = JSON.parse(loggerOptions)
        }
        catch {
          // ignore
        }

        return {
          ...db,
          autoLoadEntities: true,
          logging: loggerOptions,
          logger: new TypeORMLogger(loggerOptions),
        }
      },
      // dataSource receives the configured DataSourceOptions
      // and returns a Promise<DataSource>.
      dataSourceFactory: async (options) => {
        if (!options) {
          throw new Error('DataSourceOptions is required to initialize DataSource')
        }
        const dataSource = await new DataSource(options).initialize()
        return dataSource
      },
    }),
  ],
})
export class DatabaseModule {}
