import { Module } from '@nestjs/common'
import { AiSuggestionModule } from './ai-suggestion/ai-suggestion.module'
import { AiController } from './ai.controller'
import { AiService } from './ai.service'

@Module({
  controllers: [AiController],
  providers: [AiService],
  imports: [AiSuggestionModule],
})
export class AiModule {}
