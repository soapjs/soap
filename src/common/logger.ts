/**
 * Logger interface that defines the logging methods.
 */
export interface Logger {
  /**
   * Logs a message with the given level.
   * @param {string} level - The log level (e.g., 'info', 'error').
   * @param {string} message - The message to log.
   * @param {...unknown[]} args - Additional arguments to log.
   */
  log(level: string, message: string, ...args: unknown[]): void;

  /**
   * Logs an error message.
   * @param {string | Error} message - The error message or Error object.
   * @param {...unknown[]} args - Additional arguments to log.
   */
  error(message: string | Error, ...args: unknown[]): void;

  /**
   * Logs a warning message.
   * @param {string} message - The warning message.
   * @param {...unknown[]} args - Additional arguments to log.
   */
  warn(message: string, ...args: unknown[]): void;

  /**
   * Logs an informational message.
   * @param {string} message - The informational message.
   * @param {...unknown[]} args - Additional arguments to log.
   */
  info(message: string, ...args: unknown[]): void;

  /**
   * Logs an HTTP-related message.
   * @param {string} message - The HTTP message.
   * @param {...unknown[]} args - Additional arguments to log.
   */
  http(message: string, ...args: unknown[]): void;

  /**
   * Logs a verbose message.
   * @param {string} message - The verbose message.
   * @param {...unknown[]} args - Additional arguments to log.
   */
  verbose(message: string, ...args: unknown[]): void;

  /**
   * Logs a debug message.
   * @param {string} message - The debug message.
   * @param {...unknown[]} args - Additional arguments to log.
   */
  debug(message: string, ...args: unknown[]): void;
}

/**
 * Implementation of the Logger interface that logs to the console.
 */
export class ConsoleLogger implements Logger {
  log(level: string, message: string): void {
    console.log(`[${level}]`, message);
  }
  error(message: string): void {
    console.error(message);
  }
  warn(message: string): void {
    console.warn(message);
  }
  info(message: string): void {
    console.info(message);
  }
  http(message: string): void {
    console.log(message);
  }
  verbose(message: string): void {
    console.log(message);
  }
  debug(message: string): void {
    console.debug(message);
  }
}
