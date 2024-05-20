/* eslint-disable @typescript-eslint/no-explicit-any */
export class HttpError extends Error {
  private _status: number;
  constructor(status: number, public readonly error: string | Error) {
    super(
      `[${status || 500}] ${typeof error === "string" ? error : error.message}`
    );
    this._status = status || 500;
  }

  get status() {
    return this._status;
  }
}

export class UnsupportedHttpMethodError extends Error {
  constructor(method: string) {
    super(`Unsupported Http method "${method}"`);
  }
}

export class InvalidRoutePathError extends Error {
  constructor(path: string) {
    super(`Invalid route path: ${path}`);
  }
}

export class NotImplementedError extends Error {
  constructor(method: string) {
    super(`Metod "${method}" not implemented.`);
  }
}
