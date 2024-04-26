/* eslint-disable @typescript-eslint/no-explicit-any */
import { MiddlewareProvider } from "../middleware-provider";
import { WebFrameworkMiddleware } from "../../web-framework";
import { Validation, ValidationOptions } from "./validation";

/**
 * Middleware provider for validation.
 */
export class ValidationMiddlewareProvider implements MiddlewareProvider {
  /**
   * Creates a new instance of ValidationMiddlewareProvider.
   * @param validation The validation service instance.
   */
  constructor(private validation: Validation) {}

  /**
   * Gets the middleware function for validation.
   * @param options The options for validation middleware.
   * @returns The middleware function.
   */
  public getMiddleware(options: ValidationOptions): WebFrameworkMiddleware {
    return (request, response, next) => {
      const result = this.validation.validate(request, options);
      if (result.valid) {
        next();
      } else {
        response.status(400).send(result);
      }
    };
  }
}
