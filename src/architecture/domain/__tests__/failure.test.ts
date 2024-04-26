import { Failure } from "../failure";

describe("Failure class", () => {
  test("should create a Failure object from an error", () => {
    const error = new Error("Test error");
    const failure = Failure.fromError(error);
    expect(failure.error).toEqual(error);
    expect(failure.throwable).toBe(false);
    expect(failure.reportable).toBe(false);
  });

  test("should create a Failure object from an error with custom throwable and reportable flags", () => {
    const error = new Error("Test error");
    const throwable = true;
    const reportable = true;
    const failure = Failure.fromError(error, throwable, reportable);
    expect(failure.error).toEqual(error);
    expect(failure.throwable).toBe(throwable);
    expect(failure.reportable).toBe(reportable);
  });

  test("should create a Failure object with a custom message", () => {
    const message = "Custom error message";
    const failure = Failure.withMessage(message);
    expect(failure.error.message).toBe(message);
    expect(failure.throwable).toBe(false);
    expect(failure.reportable).toBe(false);
  });

  test("should create a Failure object with a custom message and custom throwable and reportable flags", () => {
    const message = "Custom error message";
    const throwable = true;
    const reportable = true;
    const failure = Failure.withMessage(message, throwable, reportable);
    expect(failure.error.message).toBe(message);
    expect(failure.throwable).toBe(throwable);
    expect(failure.reportable).toBe(reportable);
  });
});
