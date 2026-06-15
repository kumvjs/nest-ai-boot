import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { SysUserEntity } from '@/modules/user/entities/user.entity'
import { SysUserController } from './sys-user.controller'
import { SysUserService } from './sys-user.service'

@Module({
  imports: [TypeOrmModule.forFeature([SysUserEntity])],
  controllers: [SysUserController],
  providers: [SysUserService],
})
export class SysUserModule {}
