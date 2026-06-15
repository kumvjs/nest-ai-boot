import { INestApplication, Inject, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

import { AppConfig, appRegToken } from '@/config'
import { SwaggerConfig, swaggerRegToken } from '@/config/swagger.config'
import { API_SECURITY_AUTH } from '../decorators/swagger.decorator'
import { ErrorCodeDto } from '../dto/error-code.dto'
import { PageQueryDto } from '../dto/page-query.dto'
import { ResOp } from '../dto/response.dto'
import { CommonEntity } from '../entity/common.entity'

export function setupSwagger(
  app: INestApplication,
  configService: ConfigService,
) {
  const { name, globalPrefix } = configService.get<AppConfig>(appRegToken)!
  const { enable, path, serverUrl } = configService.get<SwaggerConfig>(swaggerRegToken)!

  if (!enable)
    return

  const swaggerPath = `${serverUrl}/${path}`

  const documentBuilder = new DocumentBuilder()
    .setTitle(name)
    .setDescription(`
🔷 **Base URL**: \`${serverUrl}/${globalPrefix}\` <br>
🧾 **Swagger JSON**: [查看文档 JSON](${swaggerPath}/json)

📌 系统 API 文档
    `)
    .setVersion('1.0')
    .addServer(`${serverUrl}/${globalPrefix}`, 'Base URL')

  // auth security
  documentBuilder.addSecurity(API_SECURITY_AUTH, {
    description: '输入令牌（Enter the token）',
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
  })

  const document = SwaggerModule.createDocument(app, documentBuilder.build(), {
    ignoreGlobalPrefix: true,

    operationIdFactory: (controllerKey: string, methodKey: string) => {
      const resource = controllerKey
        .replace(/Controller$/, '')
        .replace(/^[A-Z]/, c => c.toLowerCase())

      return resource + methodKey[0].toUpperCase() + methodKey.slice(1)
    },
    extraModels: [CommonEntity, ErrorCodeDto, ResOp, PageQueryDto],

  })

  SwaggerModule.setup(path, app, document, {
    swaggerOptions: {
      persistAuthorization: true, // 保持登录
    },
    jsonDocumentUrl: `/${path}/json`,
  })

  return () => {
    // started log
    const logger = new Logger('SwaggerModule')
    logger.log(`Swagger UI: ${swaggerPath}`)
    logger.log(`Swagger JSON: ${swaggerPath}/json`)
  }
}
