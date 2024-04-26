/* eslint-disable @typescript-eslint/no-explicit-any */
import { RouteRequest } from "../../route.types";

/**
 * Represents options for validation middleware.
 */
export type ValidationOptions = {
  /**
   * The name of the validator to be used.
   */
  validator: string;
  /**
   * The schema for validation.
   */
  schema: any;
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
export interface Validation {
  /**
   * Validates a request.
   * @param request The request object to be validated.
   * @param args Additional arguments required for validation, if any.
   * @returns The validation result.
   */
  validate(request: RouteRequest, ...args: any[]): ValidationResult;
}
