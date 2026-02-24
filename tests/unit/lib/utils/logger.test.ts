import { logger } from '@/lib/utils/logger';

describe('logger', () => {
  it('writes info and warn logs to stdout', () => {
    const stdoutSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);

    logger.info('hello', { feature: 'auth' });
    logger.warn('careful');

    expect(stdoutSpy).toHaveBeenCalled();
    stdoutSpy.mockRestore();
  });

  it('writes error logs to stderr', () => {
    const stderrSpy = jest.spyOn(process.stderr, 'write').mockImplementation(() => true);

    logger.error('boom', { code: 'X' });

    expect(stderrSpy).toHaveBeenCalled();
    stderrSpy.mockRestore();
  });
});
