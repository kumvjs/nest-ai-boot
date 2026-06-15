import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { CacheService } from '@/shared/cache/cache.service'
import { userKeys } from '@/shared/cache/keys'
import { SysUserEntity } from './entities/user.entity'

@Injectable()
export class UserService {
  constructor(
    private readonly cacheService: CacheService,
    @InjectRepository(SysUserEntity)
    private readonly userRepository: Repository<SysUserEntity>,
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

  getUserById(id: string) {
    return this.userRepository.findOne({
      where: {
        id,
      },
    })
  }

  getCachedUserById(id: string) {
    return this.cacheService.getOrSet<SysUserEntity>(
      userKeys.info(id),
      () => this.getUserById(id),
    )
  }
}
