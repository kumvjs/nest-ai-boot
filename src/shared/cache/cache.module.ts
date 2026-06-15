import { Global, Module } from '@nestjs/common'
import { CacheController } from './cache.controller'
import { CacheService } from './cache.service'
import { RedisModule } from './redis/redis.module'

@Global()
@Module({
  imports: [RedisModule],
  controllers: [CacheController],
  providers: [CacheService],
  exports: [CacheService, RedisModule],
})
export class CacheModule { }
