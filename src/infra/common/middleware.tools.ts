import { Middleware } from "./middleware";
import { MiddlewareFunction } from "./middleware.types";

export class MiddlewareTools {
  static isMiddlewareFunction(
    middleware: Middleware | MiddlewareFunction
  ): middleware is MiddlewareFunction {
    return typeof middleware === "function";
  }

  static isMiddlewareObject(
    middleware: Middleware | MiddlewareFunction
  ): middleware is Middleware {
    return (
      typeof middleware === "object" &&
      middleware !== null &&
      "use" in middleware &&
      typeof middleware.use === "function"
    );
  }
}
