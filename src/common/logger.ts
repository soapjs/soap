/**
 * Standard log levels. Lower index = more critical.
 */
export const LOG_LEVELS = [
  "error",
  "warn",
  "info",
  "http",
  "verbose",
  "debug",
] as const;
export type LogLevel = (typeof LOG_LEVELS)[number];

/**
 * Logger interface that defines the logging methods.
 *
 * Implementations are expected to honor a per-instance minimum level and to
 * support attaching a structured context (key/value pairs) to every emitted
 * record. The framework hands a `Logger` to every layer that historically
 * reached for `console.log` (HTTP middleware, error handler, auth strategies,
 * event bus adapters), so it must be cheap to create context-narrowed
 * "child" loggers — one per request, per handler, per consumer — without
 * mutating the parent.
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

  /**
   * Returns a new Logger that carries `bindings` as default context for every
   * record. Optional — adapters that wrap Winston/Pino expose this natively,
   * `ConsoleLogger` ships its own implementation. Frameworks that consume the
   * port should treat it as optional and degrade gracefully when absent.
   */
  child?(bindings: Record<string, unknown>): Logger;
}

export namespace Logger {
  /**
   * DI token under which `bootstrap()` binds the application logger.
   * Consumers in every layer (middleware, error handler, auth, event-bus
   * adapters) read the logger from the container via this token rather than
   * importing a singleton — keeps the port/adapter split honest.
   */
  export const Token = "Logger";
}

/**
 * Options for {@link ConsoleLogger}.
 */
export interface ConsoleLoggerOptions {
  /**
   * Minimum level to emit; anything below this is silently dropped. Defaults
   * to the value of `LOG_LEVEL` if set, otherwise `'info'`.
   */
  level?: LogLevel;
  /**
   * Default key/value pairs attached to every record. `child()` returns a
   * new instance with these merged with additional bindings.
   */
  context?: Record<string, unknown>;
  /**
   * Pretty `<level> message …` lines for humans (default in TTY) versus
   * single-line JSON for log shippers. `auto` picks based on `process.stdout.isTTY`.
   */
  format?: "json" | "pretty" | "auto";
  /**
   * Override the destination — handy for tests. Receives the fully-formatted
   * string, including trailing newline.
   */
  write?: (line: string) => void;
}

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
};

function isLogLevel(value: unknown): value is LogLevel {
  return (
    typeof value === "string" &&
    (LOG_LEVELS as readonly string[]).includes(value)
  );
}

function resolveDefaultLevel(): LogLevel {
  const fromEnv = process.env.LOG_LEVEL?.toLowerCase();
  return isLogLevel(fromEnv) ? fromEnv : "info";
}

function resolveDefaultFormat(): "json" | "pretty" {
  if (process.env.LOG_FORMAT === "json") return "json";
  if (process.env.LOG_FORMAT === "pretty") return "pretty";
  return process.stdout && process.stdout.isTTY ? "pretty" : "json";
}

/**
 * Implementation of the Logger interface that logs to stdout/stderr.
 *
 * Production-friendly: emits single-line JSON when stdout is not a TTY (so
 * log shippers like Loki / Datadog / CloudWatch can parse without a config),
 * pretty multi-coloured lines when run interactively. Honours `LOG_LEVEL` and
 * `LOG_FORMAT` env vars without any wiring on the caller side.
 *
 * `child()` returns a sibling instance that merges its own context with the
 * parent — used by the HTTP logging middleware to attach `requestId` /
 * `method` / `path` to every record emitted while handling that request.
 */
export class ConsoleLogger implements Logger {
  private readonly level: LogLevel;
  private readonly context: Record<string, unknown>;
  private readonly format: "json" | "pretty";
  private readonly write: (line: string) => void;

  constructor(options: ConsoleLoggerOptions = {}) {
    this.level = options.level ?? resolveDefaultLevel();
    this.context = options.context ?? {};
    this.format =
      options.format && options.format !== "auto"
        ? options.format
        : resolveDefaultFormat();
    this.write =
      options.write ??
      ((line: string) => {
        if (line.includes('"level":"error"') || line.startsWith("[error]")) {
          process.stderr.write(line + "\n");
        } else {
          process.stdout.write(line + "\n");
        }
      });
  }

  log(level: string, message: string, ...args: unknown[]): void {
    if (!isLogLevel(level)) {
      this.emit("info", `[${level}] ${message}`, args);
      return;
    }
    this.emit(level, message, args);
  }

  error(message: string | Error, ...args: unknown[]): void {
    if (message instanceof Error) {
      this.emit("error", message.message, args, {
        stack: message.stack,
        name: message.name,
      });
    } else {
      this.emit("error", message, args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    this.emit("warn", message, args);
  }

  info(message: string, ...args: unknown[]): void {
    this.emit("info", message, args);
  }

  http(message: string, ...args: unknown[]): void {
    this.emit("http", message, args);
  }

  verbose(message: string, ...args: unknown[]): void {
    this.emit("verbose", message, args);
  }

  debug(message: string, ...args: unknown[]): void {
    this.emit("debug", message, args);
  }

  /**
   * Creates a new logger sharing this logger's level/format/sink but with
   * `bindings` merged on top of the existing context. The parent is never
   * mutated, so per-request loggers can safely diverge.
   */
  child(bindings: Record<string, unknown>): Logger {
    return new ConsoleLogger({
      level: this.level,
      context: { ...this.context, ...bindings },
      format: this.format,
      write: this.write,
    });
  }

  private emit(
    level: LogLevel,
    message: string,
    args: unknown[],
    extra?: Record<string, unknown>,
  ): void {
    if (LEVEL_PRIORITY[level] > LEVEL_PRIORITY[this.level]) return;
    const record: Record<string, unknown> = {
      level,
      time: new Date().toISOString(),
      message,
      ...this.context,
      ...(extra ?? {}),
    };
    if (args.length > 0) record.args = args;

    if (this.format === "json") {
      try {
        this.write(JSON.stringify(record));
      } catch {
        // Fallback if record has circular refs — drop args and retry.
        delete record.args;
        this.write(JSON.stringify(record));
      }
      return;
    }
    const ctxKeys = Object.keys(this.context);
    const ctx =
      ctxKeys.length === 0
        ? ""
        : " " +
          ctxKeys
            .map((k) => `${k}=${JSON.stringify(this.context[k])}`)
            .join(" ");
    const argsStr =
      args.length === 0 ? "" : " " + args.map((a) => safeFormat(a)).join(" ");
    const extraStr = extra
      ? " " +
        Object.entries(extra)
          .map(([k, v]) => `${k}=${safeFormat(v)}`)
          .join(" ")
      : "";
    this.write(`[${level}] ${message}${ctx}${argsStr}${extraStr}`);
  }
}

function safeFormat(value: unknown): string {
  if (value instanceof Error) return value.stack ?? value.message;
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

/**
 * Logger that silently drops every record. Useful for tests that wire the
 * production code path but don't care about output, and as a safer default
 * than throwing when no logger is supplied.
 */
export class NoopLogger implements Logger {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  log(_level: string, _message: string, ..._args: unknown[]): void {}
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  error(_message: string | Error, ..._args: unknown[]): void {}
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  warn(_message: string, ..._args: unknown[]): void {}
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  info(_message: string, ..._args: unknown[]): void {}
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  http(_message: string, ..._args: unknown[]): void {}
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  verbose(_message: string, ..._args: unknown[]): void {}
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  debug(_message: string, ..._args: unknown[]): void {}
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  child(_bindings: Record<string, unknown>): Logger {
    return this;
  }
}
