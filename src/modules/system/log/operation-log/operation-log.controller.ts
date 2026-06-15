import { Controller } from '@nestjs/common'
import { CreateOperationLogDto } from './dto/create-operation-log.dto'
import { UpdateOperationLogDto } from './dto/update-operation-log.dto'
import { OperationLogService } from './operation-log.service'

@Controller('operation-log')
export class OperationLogController {
  constructor(private readonly operationLogService: OperationLogService) {}
}
