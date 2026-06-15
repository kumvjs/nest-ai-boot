import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AiSuggestionController } from './ai-suggestion.controller'
import { AiSuggestionService } from './ai-suggestion.service'
import { AiSuggestionEntity } from './entities/ai-suggestion.entity'

@Module({
  imports: [TypeOrmModule.forFeature([AiSuggestionEntity])],
  controllers: [AiSuggestionController],
  providers: [AiSuggestionService],
})
export class AiSuggestionModule {}
