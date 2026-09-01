import type { Repository } from 'typeorm'
import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { paginate, PaginateQuery } from 'nestjs-paginate'
import { SysUserEntity } from '#/modules/user/entities/user.entity.js'
import { CreateSysUserDto } from './dto/create-sys-user.dto.js'
import { UpdateSysUserDto } from './dto/update-sys-user.dto.js'

@Injectable()
export class SysUserService {
  constructor(
    @InjectRepository(SysUserEntity)
    private readonly userRepo: Repository<SysUserEntity>,
  ) { }

  async list(query: PaginateQuery) {
    return paginate(query, this.userRepo, {
      sortableColumns: ['id', 'nickname'],
    })
  }
}
