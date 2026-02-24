type LogLevel = 'info' | 'warn' | 'error';

function write(level: LogLevel, message: string, metadata?: Record<string, unknown>): void {
  const payload = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(metadata ? { metadata } : {}),
  };

  if (level === 'error') {
    process.stderr.write(`${JSON.stringify(payload)}\n`);
    return;
  }

  process.stdout.write(`${JSON.stringify(payload)}\n`);
}

export const logger = {
  info(message: string, metadata?: Record<string, unknown>) {
    write('info', message, metadata);
  },
  warn(message: string, metadata?: Record<string, unknown>) {
    write('warn', message, metadata);
  },
  error(message: string, metadata?: Record<string, unknown>) {
    write('error', message, metadata);
  },
};
