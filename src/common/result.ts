/* eslint-disable @typescript-eslint/no-explicit-any */
import { Failure } from "./failure";

/**
 * The class represents the result of executing an operation.
 * The result may return a Failure object or the typed content.
 * @class
 */
export class Result<ContentType = void> {
  public readonly content: ContentType;
  public readonly failure: Failure;

  /**
   * Create instances of the class Result
   *
   * @constructor
   * @private
   * @param data
   */
  private constructor(data?: { content?: ContentType; failure?: Failure }) {
    const { content, failure } = data || {};
    if (content) {
      this.content = content;
    }
    if (failure) {
      this.failure = failure;
    }
  }

  /**
   * @returns {boolean}
   */
  public isFailure(): this is Result<ContentType> & { failure: undefined } {
    return this.failure instanceof Failure;
  }

  /**
   * @returns {boolean}
   */
  public isSuccess(): this is Result<ContentType> & { failure: Failure } {
    return !this.failure;
  }

  /**
   * Create instance of the Result class with the content
   *
   * @static
   * @param {ContentType} content
   * @returns {Result<ContentType>}
   */
  public static withSuccess<ContentType>(
    content?: ContentType
  ): Result<ContentType> {
    return new Result<ContentType>({ content });
  }

  /**
   * Create instance of the Result class with the failure
   *
   * @static
   * @param {Failure | Error} failure
   * @returns
   */
  public static withFailure<ContentType = any>(
    failure: Failure | Error | string
  ): Result<ContentType> {
    if (failure instanceof Failure) {
      return new Result<ContentType>({ failure });
    }

    if (typeof failure === "string") {
      return new Result<ContentType>({
        failure: Failure.withMessage(failure),
      });
    }

    if (failure instanceof Error) {
      return new Result<ContentType>({
        failure: Failure.fromError(failure),
      });
    }

    throw new Error("Wrong Failure type");
  }
}
