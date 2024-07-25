import winston from 'winston';
import { LEVEL } from 'triple-beam';
import { format, Format } from 'logform';
import { LoggingWinston } from '@google-cloud/logging-winston';
import colors from '@colors/colors/safe';
import { isString } from './utils';

export { Logger } from 'winston';

// disable colors if NO_COLOR env variable is set
if (process.env.NO_COLOR) {
  colors.disable();
}

export type LoggerOptions = winston.LoggerOptions & {
  context?: string;
  logName?: string;
};

/**
 * Create a new logger instance.
 * @param options {LoggerOptions | string} Logger options or context string.
 */
export function createLogger(options?: LoggerOptions | string) {
  if (isString(options)) {
    options = { context: options };
  } else {
    options = options || {};
  }

  options.format = winston.format.combine(
    winston.format.errors({ stack: true, cause: true }),
    fixStack(),
    addLabels({ context: options?.context }),
    ...(options.format ? [options.format] : []),
  );

  const logger = winston.createLogger({
    level: process.env.LOGGER_LEVEL || 'info',
    ...options,
  });

  if (process.env.LOGGER === 'gcloud') {
    logger.add(createGoogleCloudTransport({ logName: options.logName }));
  } else {
    logger.add(createConsoleTransport());
  }

  return logger;
}

const fixStack = format((info) => {
  if (info[LEVEL] !== 'error' || !isString(info.stack)) {
    return info;
  }

  // check whether stack already contains message
  // if so, replace message with stack and remove stack property
  if (isString(info.message) && info.stack.includes(info.message)) {
    info.message = info.stack;
    delete info.stack;
  }

  return info;
});

const addLabels = format((info, opts) => {
  const context = info.context || opts?.context;
  const labels: Record<string, string> = info.labels || {};
  if (context) {
    labels.context = context;
  }

  delete info.context;
  info.labels = labels;

  return info;
});

function createConsoleTransport() {
  const formats: Format[] = [
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    // make level uppercase
    format((info) => {
      info.level = info.level.toUpperCase();
      return info;
    })(),
    // prepend context to message
    format((info) => {
      if (isString(info.message) && isString(info.labels?.context)) {
        const context = colors.dim(`[${info.labels.context}]`);
        info.message = `${context} ${info.message}`;
      }
      return info;
    })(),
    winston.format.colorize({ level: true, message: true }),
    winston.format.padLevels(),
    winston.format.printf((info) => {
      const { timestamp, level, message, stack, labels, ...rest } = info;
      let output = `${timestamp}: ${level}`;

      output += ` ${message}`;

      if (Object.keys(rest).length) {
        output += '\n' + JSON.stringify(rest, null, 2);
      }

      if (stack) {
        output += '\n' + stack;
      }

      return output;
    }),
  ];

  return new winston.transports.Console({
    format: winston.format.combine(...formats),
  });
}

function createGoogleCloudTransport(options?: LoggerOptions) {
  return new LoggingWinston({
    logName: options?.logName || process.env.LOGGER_NAME || 'app',
  });
}
