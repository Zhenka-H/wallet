import { ConsoleLogger, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

@Injectable()
export class LoggerService extends ConsoleLogger {
  constructor() {
    super();
  }

  debug(message: string, context: string) {
    if (process.env.NODE_ENV !== 'production') {
      super.debug(`[DEBUG] ${message}`, context);
    }
  }
  log(message: string, context: string) {
    super.log(`[INFO] ${message}`, context);
  }
  error(message: string, stackOrContext: string) {
    const traceId = randomUUID();
    super.error(`[ERROR] ${message} [TRACE ID] ${traceId}`, stackOrContext);
  }
  warn(message: string, context: string) {
    super.warn(`[WARN] ${message}`, context);
  }
  verbose(message: string, context: string) {
    if (process.env.NODE_ENV !== 'production') {
      super.verbose(`[VERBOSE] ${message}`, context);
    }
  }
}
