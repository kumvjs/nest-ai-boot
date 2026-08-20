import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common'
import { ApiOperation } from '@nestjs/swagger'
import { CurrentUser } from '@/common/decorators/current-user.decorator'
import { Public } from '@/common/decorators/public.decorator'
import { ApiSecurityAuth } from '@/common/decorators/swagger.decorator'
import { CreateWssEventDto } from './dto/create-wss-event.dto'
import { UpdateWssEventDto } from './dto/update-wss-event.dto'
import { WssEventService } from './wss-event.service'

@ApiSecurityAuth()
@Controller('wss-events')
export class WssEventController {
  constructor(private readonly wssEventService: WssEventService) { }
  @ApiOperation({ summary: 'WSS 数据源事件接收接口' })
  @Public()
  @Post('ingest')
  ingest(@Body() dto, @CurrentUser() loginUser?: LoginUserContext) {
    return this.wssEventService.ingest(dto, loginUser?.user)
  }
}
