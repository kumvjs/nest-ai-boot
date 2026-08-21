import { ClassSerializerInterceptor, MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core'
import { CatchEverythingFilter } from './common/filters/catch-everything.filter'
import { TransformInterceptor } from './common/interceptors/transform.interceptor'
import { TraceMiddleware } from './common/middleware/trace.middleware'
import config from './config'
import { envValidationSchema } from './config/env.validation'
import { AiModule } from './modules/ai/ai.module'
import { AuthModule } from './modules/auth/auth.module'
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard'
import { RbacGuard } from './modules/auth/guards/rbac.guard'
import { SystemModule } from './modules/system/system.module'
import { UserModule } from './modules/user/user.module'
import { WebsocketModule } from './modules/websocket/websocket.module'
import { DatabaseModule } from './shared/database/database.module'
import { SharedModule } from './shared/shared.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      envFilePath: [`.env.${process.env.NODE_ENV || 'development'}`, '.env'],
      validationSchema: envValidationSchema,
      load: [...Object.values(config)],
    }),
    SharedModule,
    DatabaseModule,
    AuthModule,
    UserModule,
    AiModule,
    SystemModule,
    WebsocketModule,
  ],
  controllers: [],
  providers: [
    { provide: APP_FILTER, useClass: CatchEverythingFilter },

    { provide: APP_INTERCEPTOR, useClass: ClassSerializerInterceptor },

    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },

    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RbacGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TraceMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL }) // 全局生效
  }
}
