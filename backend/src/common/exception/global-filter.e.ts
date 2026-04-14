import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { LoggerService } from '../../logger/logger.s';
import { QueryFailedError } from 'typeorm';

interface IError {
  message: string;
  codeError: string | null;
  detail?: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest<Record<string, unknown>>();

    let status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    let message =
      exception instanceof HttpException
        ? typeof exception.getResponse() === 'string'
          ? ({ message: exception.getResponse(), codeError: null } as IError)
          : (exception.getResponse() as IError)
        : { message: (exception as Error).message || 'Internal server error', codeError: null };

    if (Array.isArray((message as unknown as Record<string, unknown>).message)) {
      message.message = (message as unknown as Record<string, unknown[] | string>).message.toString();
    }

    if (exception instanceof QueryFailedError || (exception as Record<string, string>)?.name === 'QueryFailedError') {
      const err = exception as Record<string, string> & { driverError?: { code: string } };
      const code = err.code || err.driverError?.code;

      switch (code) {
        case '23505':
          status = HttpStatus.CONFLICT;
          message = { message: 'Duplicate key value violates unique constraint', codeError: code, detail: (err as any).detail };
          break;
        case '23503':
          status = HttpStatus.BAD_REQUEST;
          message = { message: 'Foreign key violation', codeError: code, detail: (err as any).detail };
          break;
        case '22P02':
        case '23502':
          status = HttpStatus.BAD_REQUEST;
          message = { message: 'Database constraint violation', codeError: code, detail: (err as any).detail };
          break;
        default:
          status = HttpStatus.INTERNAL_SERVER_ERROR;
          message = { message: 'Internal Database Error', codeError: code || 'DB_ERROR', detail: (err as any).detail };
          break;
      }
    }

    const responseData = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url as string,
      ...message,
    };

    this.logMessage(request, message as IError, status);
    response.status(status).json(responseData);
  }

  private logMessage(
    request: Record<string, unknown>,
    message: IError,
    status: number,
  ): void {
    if (status === 500) {
      this.logger.error(
        `End Request for ${request.url}`,
        `method:=${request.method} status:=${status} code_error:=${
          message.codeError ? message.codeError : null
        } message:='${message.message ? message.message : null}' url:='${request.url}'`,
      );
    } else {
      this.logger.warn(
        `End Request for ${request.url}`,
        `method=${request.method} status=${status} code_error=${
          message.codeError ? message.codeError : null
        } message=${message.message ? message.message : null}`,
      );
    }
  }
}
