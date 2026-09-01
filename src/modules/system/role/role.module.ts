import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { SysRoleEntity } from './entities/role.entity.js'
import { RoleController } from './role.controller.js'
import { RoleService } from './role.service.js'

@Module({
  imports: [TypeOrmModule.forFeature([SysRoleEntity])],
  controllers: [RoleController],
  providers: [RoleService],
  exports: [RoleService],
})
export class RoleModule {}
