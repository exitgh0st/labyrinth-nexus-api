import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    Logger,
    Inject,
  } from '@nestjs/common';
  import { Observable } from 'rxjs';
  import { tap } from 'rxjs/operators';
  import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
  
  @Injectable()
  export class LoggingInterceptor implements NestInterceptor {
    constructor(
      @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: Logger
    ) {}
  
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
      const request = context.switchToHttp().getRequest();
      const { method, url, ip, body } = request;
      const userAgent = request.get('user-agent') || '';
      const startTime = Date.now();
  
      this.logger.log({
        message: 'Incoming Request',
        method,
        url,
        ip,
        userAgent,
        body: body || {},
        context: 'HTTP',
      });
  
      return next.handle().pipe(
        tap({
          next: (data) => {
            const response = context.switchToHttp().getResponse();
            const { statusCode } = response;
            const responseTime = Date.now() - startTime;
  
            this.logger.log({
              message: 'Request Completed',
              method,
              url,
              statusCode,
              responseTime: `${responseTime}ms`,
              context: 'HTTP',
            });
          },
          error: (error) => {
            const responseTime = Date.now() - startTime;
            
            this.logger.error({
              message: 'Request Failed',
              method,
              url,
              statusCode: error.status || 500,
              responseTime: `${responseTime}ms`,
              error: error.message,
              stack: error.stack,
              context: 'HTTP',
            });
          },
        })
      );
    }
  }
  