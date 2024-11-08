import { createLogger } from './logger';

afterEach(() => {
  jest.restoreAllMocks();
});

it('should log to console in non test environment', async () => {
  // arrange
  jest.replaceProperty(process.env, 'NODE_ENV', 'not test');
  const logger = createLogger();
  const logFn = jest.fn();
  for (const transport of logger.transports) {
    jest.spyOn(transport, 'log').mockImplementation(logFn);
  }

  // act
  logger.info('test message');

  // assert
  expect(logFn).toHaveBeenCalled();
});

it('should be silent in test environment', async () => {
  // arrange
  jest.replaceProperty(process.env, 'NODE_ENV', 'test');
  const logger = createLogger();
  const logFn = jest.fn();
  for (const transport of logger.transports) {
    jest.spyOn(transport, 'log').mockImplementation(logFn);
  }

  // act
  logger.info('test message');

  // assert
  expect(logFn).not.toHaveBeenCalled();
});
