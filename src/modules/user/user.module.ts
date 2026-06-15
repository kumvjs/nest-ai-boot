import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import SysUserRoleEntity from './entities/user-role.entity'
import { SysUserEntity } from './entities/user.entity'
import { UserRoleService } from './user-role/user-role.service'
import { UserController } from './user.controller'
import { UserService } from './user.service'

@Module({
  imports: [TypeOrmModule.forFeature([SysUserEntity, SysUserRoleEntity])],
  controllers: [UserController],
  providers: [UserService, UserRoleService],
  exports: [UserService, UserRoleService],
})
export class UserModule {}
