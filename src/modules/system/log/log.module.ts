import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CaptchaLogEntity } from './entities/captcha-log.entity'
import { LoginLogEntity } from './entities/login-log.entity'
import { LoginLogService } from './services/login-log.service'
import { OperationLogModule } from './operation-log/operation-log.module'

@Module({
  imports: [TypeOrmModule.forFeature([LoginLogEntity, CaptchaLogEntity])],
  controllers: [],
  providers: [LoginLogService, OperationLogModule],
  exports: [LoginLogService],
})
export class LogModule { }
