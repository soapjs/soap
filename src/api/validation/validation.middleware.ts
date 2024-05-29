/* eslint-disable @typescript-eslint/no-explicit-any */
import { Middleware } from "../middleware";

/**
 * Represents options for validation middleware.
 */
export type RouteValidationOptions = {
  /**
   * The name of the validator to be used.
   */
  validator: string;
  /**
   * The schema for validation.
   */
  schema: any;
  /**
   *
   */
  [key: string]: unknown;
};

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
