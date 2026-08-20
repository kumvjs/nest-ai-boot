import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common'
import { CreateWssEventLogDto } from './dto/create-wss-event-log.dto'
import { UpdateWssEventLogDto } from './dto/update-wss-event-log.dto'
import { WssEventLogService } from './wss-event-log.service'

@Controller('wss-event-log')
export class WssEventLogController {
  constructor(private readonly wssEventLogService: WssEventLogService) { }
}
