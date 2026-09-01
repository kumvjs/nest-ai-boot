import { Module } from '@nestjs/common'
import { RouterModule } from '@nestjs/core'
import { LogModule } from './log/log.module.js'
import { MenuModule } from './menu/menu.module.js'
import { RoleModule } from './role/role.module.js'
import { SysUserModule } from './sys-user/sys-user.module.js'

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
