import { createLogger } from './logger';

it('should log to console in non test environment', async () => {
  // arrange
  process.env.NODE_ENV = 'not test';
  const logger = createLogger();
  const logMethodSpy = jest.spyOn(logger.transports[0], 'log');

  // act
  logger.info('test message');

  // assert
  expect(logMethodSpy).toHaveBeenCalled();
});

it('should be silent in test environment', async () => {
  // arrange
  process.env.NODE_ENV = 'test';
  const logger = createLogger();
  const logMethodSpy = jest.spyOn(logger.transports[0], 'log');

  // act
  logger.info('test message');

  // assert
  expect(logMethodSpy).not.toHaveBeenCalled();
});
