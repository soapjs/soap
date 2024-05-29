import { readEnvFile } from "./config.utils";

export class UndefinedEnviromentVariableError extends Error {
  constructor(name: string) {
    super(`"${name}" is undefined`);
  }
}

/**
 * Represents a configuration variables class that provides access to environment variables and values from a .env file.
 * @class
 */
export class ConfigVars {
  private dotEnv;

  /**
   * Constructs a new instance of ConfigVars.
   * @param {string} [envPath] - The path to the .env file.
   */
  constructor(envPath?: string) {
    this.dotEnv = readEnvFile(envPath);
  }

  /**
   * Retrieves the value of an environment variable or a variable from the .env file.
   * @private
   * @param {string} name - The name of the environment variable.
   * @returns {unknown} The value of the environment variable.
   */
  private getEnv(name: string, throwIfUndefined: boolean): unknown {
    const v = process.env[name] || this.dotEnv[name];
    if (throwIfUndefined && v === undefined) {
      throw new UndefinedEnviromentVariableError(name);
    }
    return v;
  }

  /**
   * Retrieves the value of an environment variable as a number.
   * @public
   * @param {string} name - The name of the environment variable.
   * @returns {number} The value of the environment variable as a number. Returns NaN if the value cannot be converted to a number.
   */
  public getNumberEnv(name: string, throwIfUndefined = false): number {
    const env = this.getEnv(name, throwIfUndefined);
    return env ? Number(env) : NaN;
  }

  /**
   * Retrieves the value of an environment variable as a string.
   * @public
   * @param {string} name - The name of the environment variable.
   * @returns {string} The value of the environment variable as a string. Returns an empty string if the value is not defined.
   */
  public getStringEnv<T = string>(name: string, throwIfUndefined = false): T {
    const env = this.getEnv(name, throwIfUndefined);
    return (env ? String(env) : "") as T;
  }

  /**
   * Retrieves the value of an environment variable as a boolean.
   * @public
   * @param {string} name - The name of the environment variable.
   * @returns {boolean | null} The value of the environment variable as a boolean. Returns null if the value cannot be converted to a boolean.
   */
  public getBooleanEnv(name: string, throwIfUndefined = false): boolean {
    const stringEnv = this.getStringEnv(name, throwIfUndefined);

    if (stringEnv === "true") {
      return true;
    }

    if (stringEnv === "false") {
      return false;
    }

    const env = this.getNumberEnv(name, throwIfUndefined);

    return Number.isNaN(env) ? null : Boolean(env);
  }

  /**
   * Retrieves the value of an environment variable as an array of strings.
   * @public
   * @param {string} name - The name of the environment variable.
   * @returns {string[]} The value of the environment variable as an array of strings. Returns an empty array if the value is not defined or cannot be split into an array.
   */
  public getArrayEnv<T = string>(
    name: string,
    options = { splitter: /,\s*/, throwIfUndefined: false }
  ): T[] {
    const env = this.getStringEnv(name, options.throwIfUndefined) || "";
    return (env ? env.split(options.splitter) : []) as T[];
  }
}
