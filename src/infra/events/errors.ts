export class EventValidationError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = "EventValidationError";
  }
}

export class EventParsingError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = "EventParsingError";
  }
}

export class HandlerExecutionError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = "HandlerExecutionError";
  }
}
