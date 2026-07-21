type LogLevel = 'info' | 'warn' | 'error';

class Logger {
  private log(level: LogLevel, message: string, meta?: Record<string, unknown>) {
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] [${level.toUpperCase()}]: ${message}`;
    
    // Do not log sensitive data, you can implement filter here later
    const logData = meta ? { ...meta } : undefined;
    if (logData) {
      delete logData.password;
      delete logData.token;
      delete logData.otp;
    }

    if (level === 'error') {
      console.error(formattedMessage, logData ? logData : '');
    } else if (level === 'warn') {
      console.warn(formattedMessage, logData ? logData : '');
    } else {
      console.info(formattedMessage, logData ? logData : '');
    }
  }

  info(message: string, meta?: Record<string, unknown>) {
    this.log('info', message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>) {
    this.log('warn', message, meta);
  }

  error(message: string, meta?: Record<string, unknown>) {
    this.log('error', message, meta);
  }
}

export const logger = new Logger();
