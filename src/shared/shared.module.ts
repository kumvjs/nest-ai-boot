import { Global, Module } from '@nestjs/common'
import { CacheModule } from './cache/cache.module'

import { LoggerModule } from './logger/logger.module'

@Global()
@Module({
  imports: [LoggerModule, CacheModule],
  exports: [LoggerModule],
})
export class SharedModule {}
