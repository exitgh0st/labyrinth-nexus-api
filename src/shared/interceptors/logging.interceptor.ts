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
    // List of sensitive fields that should not be logged
    private readonly sensitiveFields = [
      'password',
      'passwordHash',
      'currentPassword',
      'newPassword',
      'token',
      'refreshToken',
      'accessToken',
      'secret',
      'apiKey',
      'authorization',
      'cookie',
    ];

    constructor(
      @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: Logger
    ) {}

    /**
     * Recursively sanitizes an object by replacing sensitive field values with [REDACTED]
     */
    private sanitizeObject(obj: any, depth = 0): any {
      // Prevent infinite recursion
      if (depth > 10 || obj === null || obj === undefined) {
        return obj;
      }

      // Handle arrays
      if (Array.isArray(obj)) {
        return obj.map(item => this.sanitizeObject(item, depth + 1));
      }

      // Handle objects
      if (typeof obj === 'object') {
        const sanitized: any = {};
        for (const [key, value] of Object.entries(obj)) {
          // Check if the key is sensitive (case-insensitive)
          const isSensitive = this.sensitiveFields.some(
            field => key.toLowerCase().includes(field.toLowerCase())
          );

          if (isSensitive) {
            sanitized[key] = '[REDACTED]';
          } else if (typeof value === 'object') {
            sanitized[key] = this.sanitizeObject(value, depth + 1);
          } else {
            sanitized[key] = value;
          }
        }
        return sanitized;
      }

      return obj;
    }

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
        body: this.sanitizeObject(body || {}),
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
  