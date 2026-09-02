import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { SysUserEntity } from '#/modules/user/entities/user.entity.js'
import { SysUserController } from './sys-user.controller.js'
import { SysUserService } from './sys-user.service.js'

@Module({
  imports: [TypeOrmModule.forFeature([SysUserEntity])],
  controllers: [SysUserController],
  providers: [SysUserService],
})
export class SysUserModule { }
