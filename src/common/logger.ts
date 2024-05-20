export interface Logger {
  log(level: string, message: string, ...args: unknown[]): void;
  error(message: string | Error, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  http(message: string, ...args: unknown[]): void;
  verbose(message: string, ...args: unknown[]): void;
  debug(message: string, ...args: unknown[]): void;
}

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
