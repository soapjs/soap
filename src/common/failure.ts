/**
 * Represents a failure as a result of an error
 * in executing a use case or repository operation.
 * @class
 */
export class Failure {
  /**
   * @private
   * @constructor
   * @param {Error} error - The error object representing the failure.
   * @param {boolean} throwable - Indicates whether the failure should be thrown (true) or not (false).
   * @param {boolean} reportable - Indicates whether the failure should be reported for analysis (true) or not (false).
   */
  private constructor(
    public readonly error: Error,
    public readonly throwable: boolean,
    public readonly reportable: boolean
  ) {}

  /**
   * Creates Failure object from the given error.
   *
   * @static
   * @param {Error} error - The error object representing the failure.
   * @param {boolean} throwable - Indicates whether the failure should be thrown (true) or not (false).
   * @param {boolean} reportable - Indicates whether the failure should be reported for analysis (true) or not (false).
   * @returns {Failure}
   */
  public static fromError(
    error: Error,
    throwable = false,
    reportable = false
  ): Failure {
    return new Failure(error, throwable, reportable);
  }

  /**
   * creates a Failure with an error
   * containing the given message.
   *
   * @static
   * @param {string} message - The error message describing the failure.
   * @param {boolean} throwable - Indicates whether the failure should be thrown (true) or not (false).
   * @param {boolean} reportable - Indicates whether the failure should be reported for analysis (true) or not (false).
   * @returns {Failure}
   */
  public static withMessage(
    message: string,
    throwable = false,
    reportable = false
  ): Failure {
    return new Failure(new Error(message), throwable, reportable);
  }
}
