import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ERROR_CODES } from '@/common/constants/error-code.constant'
import { BusinessException } from '@/common/exceptions/business.exception'
import { CacheService } from '@/shared/cache/cache.service'
import { userKeys } from '@/shared/cache/keys'
import { SysUserEntity } from './entities/user.entity'
import { UserRoleService } from './user-role/user-role.service'

@Injectable()
export class UserService {
  constructor(
    private readonly cacheService: CacheService,
    @InjectRepository(SysUserEntity)
    private readonly userRepository: Repository<SysUserEntity>,
    private readonly userRoleService: UserRoleService,
  ) { }

  findUserByUserName(username: string) {
    return this.userRepository.findOne({
      where: {
        username,
      },
    })
  }

  /**
   * 登录专用方法：内部显式携带密码和盐
   */
  findUserForLogin(username: string) {
    return this.userRepository
      .createQueryBuilder('user')
      .where('user.username = :username', { username })
      .addSelect(['user.password_hash', 'user.psalt']) // 捞出密码
      .getOne()
  }

  async getUserById(id: string) {
    const u = await this.userRepository.findOne({
      where: {
        id,
      },
    })
    if (!u) {
      throw new BusinessException(ERROR_CODES.USER_NOT_FOUND)
    }
    return u
  }

  async info(id: string) {
    const u = await this.getUserById(id)
    const roles = await this.userRoleService.getUserRoleCodes(id)
    return {
      ...u,
      realName: u?.nickname,
      roles,
    }
  }

  getCachedUserById(id: string) {
    return this.cacheService.getOrSet<SysUserEntity>(
      userKeys.info(id),
      () => this.getUserById(id),
    )
  }
}
