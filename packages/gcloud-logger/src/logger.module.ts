import { Global, Module, Scope } from '@nestjs/common';
import { LoggerService } from './logger.service';
import { createLogger, Logger } from './logger';

@Global()
@Module({
  providers: [
    {
      provide: Logger,
      useFactory: createLogger,
      scope: Scope.TRANSIENT,
    },
    {
      provide: LoggerService,
      useClass: LoggerService,
      scope: Scope.TRANSIENT,
    },
  ],
  exports: [Logger, LoggerService],
})
export class LoggerModule {}
