import { Module } from '@nestjs/common'
import { RouterModule } from '@nestjs/core'
import { LogModule } from './log/log.module'
import { MenuModule } from './menu/menu.module'
import { RoleModule } from './role/role.module'
import { SysUserModule } from './sys-user/sys-user.module'

const modules = [
  RoleModule,
  MenuModule,
  LogModule,
  SysUserModule,
]

@Module({
  imports: [
    ...modules,
    RouterModule.register([
      {
        path: 'system',
        module: SystemModule,
        children: [...modules],
      },
    ]),
  ],
  exports: [...modules],
})
export class SystemModule {}
