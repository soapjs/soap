import { Result } from "../result";
import { Failure } from "../failure";

describe("Result class", () => {
  test("should create a Result object with content", () => {
    const content = { message: "Test content" };
    const result = Result.withContent(content);
    expect(result.content).toEqual(content);
    expect(result.failure).toBeUndefined();
    expect(result.isFailure).toBe(false);
  });

  test("should create a Result object without content", () => {
    const result = Result.withoutContent();
    expect(result.content).toBeUndefined();
    expect(result.failure).toBeUndefined();
    expect(result.isFailure).toBe(false);
  });

  test("should create a Result object with a Failure object", () => {
    const failure = Failure.withMessage("Test failure");
    const result = Result.withFailure(failure);
    expect(result.content).toBeUndefined();
    expect(result.failure).toEqual(failure);
    expect(result.isFailure).toBe(true);
  });

  test("should create a Result object with an Error object", () => {
    const error = new Error("Test error");
    const result = Result.withFailure(error);
    expect(result.content).toBeUndefined();
    expect(result.failure).toBeInstanceOf(Failure);
    expect(result.failure.error).toEqual(error);
    expect(result.isFailure).toBe(true);
  });

  test("should create a Result object with a Failure object from a string message", () => {
    const message = "Test failure message";
    const result = Result.withFailure(message);
    expect(result.content).toBeUndefined();
    expect(result.failure).toBeInstanceOf(Failure);
    expect(result.failure.error.message).toBe(message);
    expect(result.isFailure).toBe(true);
  });

  test("should throw an error for an invalid failure type", () => {
    const invalidType = 123;
    expect(() => Result.withFailure(invalidType as any)).toThrowError(
      "Wrong Failure type"
    );
  });
});
