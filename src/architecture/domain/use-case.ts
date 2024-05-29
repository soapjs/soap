/* istanbul ignore file */
import { Result } from "./result";

/**
 * Represents an UseCase interface.
 * @interface
 * @template T - The type of the result from executing the use case.
 */
export interface UseCase<T = unknown> {
  /**
   * Executes the use case with the provided arguments.
   * @param {...unknown[]} rest - Additional arguments for executing the use case.
   * @returns {Promise<Result<T>> | Result<T> | void} A promise or result of the execution.
   */
  execute(...rest: unknown[]): Promise<Result<T>> | Result<T> | void;
}
