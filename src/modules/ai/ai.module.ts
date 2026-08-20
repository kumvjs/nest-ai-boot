import { Module } from '@nestjs/common'
import { AiController } from './ai.controller'
import { AiService } from './ai.service'

@Module({
  controllers: [AiController],
  providers: [AiService],
  imports: [],
  exports: [AiService],
})
export class AiModule { }
