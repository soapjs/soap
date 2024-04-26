/* eslint-disable @typescript-eslint/no-explicit-any */

import { Route } from "./route";
import { Router } from "./router";
import { AuthMiddlewareProvider } from "./middlewares/auth/auth.middleware-provider";
import { WebFrameworkMethods, WebFrameworkMiddleware } from "./web-framework";
import { RouteHandler, RouteOptions } from "./route.types";
import { RouteIO } from "./route-io";
import { ValidationMiddlewareProvider } from "./middlewares/validation/validation.middleware-provider";
import { CorsMiddlewareProvider } from "./middlewares/cors/cors.middleware-provider";
import { RateLimiterMiddlewareProvider } from "./middlewares/rate-limiter/rate-limiter.middleware-provider";
import { ThrottlerMiddlewareProvider } from "./middlewares/throttler/throttler.middleware-provider";

export type RouteMiddlewareProviders = {
  auth?: AuthMiddlewareProvider;
  validation?: ValidationMiddlewareProvider;
  cors?: CorsMiddlewareProvider;
  limiter?: RateLimiterMiddlewareProvider;
  throttler?: ThrottlerMiddlewareProvider;
};

/**
 * Abstract class representing a basic router.
 */
export abstract class BasicRouter<ContainerType = any, ConfigType = any>
  implements Router
{
  /**
   * Constructor for BasicRouter class.
   * @constructor
   * @param {WebFrameworkMethods} framework - The web framework methods used for routing.
   * @param {ContainerType} container - The container for dependency injection.
   * @param {ConfigType} config - The configuration object.
   * @param {RouteMiddlewareProviders} [middlewareProviders] - Optional middleware providers for handling route-specific middleware.
   */
  constructor(
    protected framework: WebFrameworkMethods,
    protected container: ContainerType,
    protected config: ConfigType,
    protected middlewareProviders?: RouteMiddlewareProviders
  ) {}

  /**
   * Sets up middlewares based on route options.
   * @param options Route options.
   * @returns Array of middlewares.
   */
  protected setupMiddlewares(options: RouteOptions): WebFrameworkMiddleware[] {
    const middlewares: WebFrameworkMiddleware[] = [];

    if (options.auth && this.middlewareProviders?.auth) {
      middlewares.push(
        this.middlewareProviders.auth.getMiddleware(options.auth)
      );
    }

    if (options.validation && this.middlewareProviders?.validation) {
      middlewares.push(
        this.middlewareProviders.validation.getMiddleware(options.validation)
      );
    }

    if (options.cors && this.middlewareProviders?.cors) {
      middlewares.push(
        this.middlewareProviders.cors.getMiddleware(options.cors)
      );
    }

    if (options.limiter && this.middlewareProviders?.limiter) {
      middlewares.push(
        this.middlewareProviders.limiter.getMiddleware(options.limiter)
      );
    }

    if (options.throttler && this.middlewareProviders?.throttler) {
      middlewares.push(
        this.middlewareProviders.throttler.getMiddleware(options.throttler)
      );
    }

    if (Array.isArray(options.middlewares)) {
      middlewares.push(...options.middlewares);
    }

    return middlewares;
  }

  /**
   * Creates a request handler function based on the handler and IO options.
   * @param handler Route handler function.
   * @param io Route IO options.
   * @returns Request handler function.
   */
  protected createRequestHandler(handler: RouteHandler, io?: RouteIO) {
    return async function (request, response) {
      try {
        const input = io?.fromRequest ? io.fromRequest(request) : undefined;
        const result = await handler(input);

        if (io?.toResponse) {
          return io.toResponse(response, result);
        } else if (result.isFailure) {
          return response.status(500).send("Internal Server Error");
        } else {
          return response.status(200).send(result.content || "OK");
        }
      } catch (error) {
        console.log(error);
        return response.status(500).send("Internal Server Error");
      }
    };
  }

  /**
   * Mounts a route.
   * @param route Route to mount.
   */
  protected mountRoute(route: Route) {
    const method = route.method.toLowerCase();
    const middlewares = this.setupMiddlewares(route.options);
    const handler = this.createRequestHandler(route.handler, route.options?.io);

    if (!this.framework[method]) {
      throw new Error("Method not defined");
    }

    if (Array.isArray(route.path)) {
      route.path.forEach((path) => {
        this.framework[method](path, middlewares, handler);
      });
    } else {
      this.framework[method](<string>route.path, middlewares, handler);
    }
  }

  /**
   * Mounts a route or a set of routes.
   * @param data Route or set of routes to mount.
   */
  public mount(data: Route | Route[]) {
    if (Array.isArray(data)) {
      data.forEach((route) => this.mountRoute(route));
    } else {
      this.mountRoute(data);
    }
  }

  /**
   * Configures the router.
   * @param args Configuration arguments.
   */
  public abstract configure(...args: unknown[]);
}
