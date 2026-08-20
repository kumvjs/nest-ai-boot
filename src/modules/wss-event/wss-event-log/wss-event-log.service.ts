import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { CreateWssEventLogDto } from './dto/create-wss-event-log.dto'
import { UpdateWssEventLogDto } from './dto/update-wss-event-log.dto'
import { WssEventLogEntity } from './entities/wss-event-log.entity'

@Injectable()
export class WssEventLogService {
  constructor(
    @InjectRepository(WssEventLogEntity)
    private wssEventLogRepository: Repository<WssEventLogEntity>,
  ) { }

  create(dto: CreateWssEventLogDto) {
    const entity = this.wssEventLogRepository.create(dto)
    return this.wssEventLogRepository.save(entity)
  }
}
