import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { In, Repository } from 'typeorm'
import { CreateRoleDto } from './dto/create-role.dto'
import { UpdateRoleDto } from './dto/update-role.dto'
import { SysRoleEntity } from './entities/role.entity'

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(SysRoleEntity)
    private readonly roleRepository: Repository<SysRoleEntity>,
  ) {}

  async getRoleCodes(ids: string[]): Promise<string[]> {
    const roles
      = await this.roleRepository.find({
        select: { code: true },
        where: {
          id: In(ids),
        },
      })
    return roles.map(r => r.code)
  }
}
