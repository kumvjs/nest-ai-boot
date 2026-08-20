import { Injectable } from '@nestjs/common'
import { SysUserEntity } from '../user/entities/user.entity'
import { CreateWssEventDto } from './dto/create-wss-event.dto'
import { UpdateWssEventDto } from './dto/update-wss-event.dto'

@Injectable()
export class WssEventService {
  async ingest(dto, user?: SysUserEntity) {
  }
}
