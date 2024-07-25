/* eslint-disable @typescript-eslint/no-explicit-any */
import { LoggerService as NestLoggerService } from '@nestjs/common';
import { createLogger } from './logger';
import { isStack, isString } from './utils';

export type LogLevel = 'info' | 'error' | 'warn' | 'debug' | 'verbose';

/**
 * Wrapper around winston.Logger for using with NestJS native logger.
 */
export class LoggerService implements NestLoggerService {
  private logger = createLogger(this.context);
  constructor(private context?: string) {}

  log(...args: any[]) {
    this.addLog('info', args);
  }

  error(...args: any[]) {
    this.addLog('error', args);
  }

  warn(...args: any[]) {
    this.addLog('warn', args);
  }

  debug(...args: any[]) {
    this.addLog('debug', args);
  }

  verbose(...args: any[]) {
    this.addLog('verbose', args);
  }

  fatal(...args: any[]) {
    this.addLog('error', args);
  }

  setLogLevels() {
    throw new Error('Method not implemented.');
  }

  private addLog(level: LogLevel, _args: any[]) {
    const info =
      level === 'error'
        ? this.prepareErrorInfo(_args)
        : this.prepareInfo(_args);
    this.logger.log({ level, ...info });
  }

  private prepareInfo(_args: unknown[]): Info {
    // eslint-disable-next-line prefer-const
    let [firstArgs, ...args] = _args;
    const message = firstArgs as string;
    const info: Info = { message };

    if (this.context) {
      info.context = this.context;
    }

    if (!args?.length) {
      return info;
    }

    const lastElement = args[args.length - 1];
    if (isString(lastElement)) {
      args = args.slice(0, args.length - 1);
      info.context = lastElement;
    }

    if (args.length) {
      info.args = args;
    }

    return info;
  }

  private prepareErrorInfo(_args: unknown[]): ErrorInfo {
    const args = [..._args];
    let stack: string | undefined = undefined;
    // find stack and remove it from args
    for (const argNo in args) {
      const arg = args[argNo];
      if (isStack(arg)) {
        stack = arg;
        args.splice(Number(argNo), 1);
      }
    }

    const info: ErrorInfo = this.prepareInfo(args);

    if (stack) {
      info.stack = stack;
    }

    return info;
  }
}

type Info = {
  message: string;
  args?: any[];
  context?: string;
};

type ErrorInfo = Info & {
  stack?: string;
};
