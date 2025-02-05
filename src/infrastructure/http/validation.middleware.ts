/* eslint-disable @typescript-eslint/no-explicit-any */
import { RouteValidationOptions } from "./types";
import { Middleware } from "./middleware";

/**
 * Represents the result of a validation operation.
 */
export type ValidationResult = {
  /**
   * Indicates whether the validation was successful.
   */
  valid: boolean;
  /**
   * Optional message describing the validation result.
   */
  message?: string;
  /**
   * Optional error code associated with the validation result.
   */
  code?: number;
  /**
   * Optional array of detailed error messages.
   */
  errors?: string[];
};

/**
 * Represents a validation service interface.
 */
export interface ValidationMiddleware extends Middleware {
  /**
   * Validates a request.
   * @param {RouteValidationOptions} options Additional options for validation.
   * @returns The validation result.
   */
  use(options: RouteValidationOptions): any;
}
