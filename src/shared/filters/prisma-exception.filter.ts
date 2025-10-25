import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpStatus
  } from '@nestjs/common';
  import { Prisma } from 'generated/prisma';
  import { Response } from 'express';
  
  @Catch(Prisma.PrismaClientKnownRequestError)
  export class PrismaExceptionFilter implements ExceptionFilter {
    catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse<Response>();
  
      let status: HttpStatus;
      let message: string;
  
      switch (exception.code) {
        case 'P2002': // Unique constraint
          status = HttpStatus.CONFLICT;
          message = 'Resource already exists';
          break;
        
        case 'P2025': // Not found
          status = HttpStatus.NOT_FOUND;
          message = 'Resource not found';
          break;
        
        case 'P2003': // Foreign key constraint
          status = HttpStatus.BAD_REQUEST;
          message = 'Invalid reference';
          break;
        
        default:
          status = HttpStatus.INTERNAL_SERVER_ERROR;
          message = 'Internal server error';
      }
  
      response.status(status).json({
        statusCode: status,
        message,
        error: exception.code,
      });
    }
  }