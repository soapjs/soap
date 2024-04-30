import { Router } from "../router";
import { Route } from "../route";
import { RouteOptions } from "../route.types";
import { WebFrameworkMethods } from "../web-framework";

const middlewareProviders = {
  auth: {
    getMiddleware: jest.fn(),
  },
  validation: {
    getMiddleware: jest.fn(),
  },
  cors: {
    getMiddleware: jest.fn(),
  },
  limiter: {
    getMiddleware: jest.fn(),
  },
  throttler: {
    getMiddleware: jest.fn(),
  },
};

class CustomRouter extends Router {
  protected callFrameworkMethod(
    path: string,
    framework: any,
    method: string,
    middlewares: any[],
    handler: (...args: any[]) => any
  ): (...args: any[]) => any {
    return framework[method](path, middlewares, handler);
  }
  public configure(...args: unknown[]) {}
}

describe("Router", () => {
  let router: Router;

  beforeEach(() => {
    const framework: WebFrameworkMethods = {
      get: jest.fn(),
      post: jest.fn(),
      patch: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    };

    router = new CustomRouter(framework, {}, {}, middlewareProviders as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("mount", () => {
    it("should mount a single route", () => {
      const route: Route = new Route("GET", "/test", jest.fn(), {
        auth: { authenticator: "passport", type: "jwt" },
      });
      router.mount(route);

      expect(router["framework"].get).toHaveBeenCalledWith(
        "/test",
        expect.any(Array),
        expect.any(Function)
      );
    });

    it("should mount multiple routes", () => {
      const routes: Route[] = [
        new Route("GET", "/test1", jest.fn(), {
          auth: { authenticator: "passport", type: "jwt" },
        }),
        new Route("POST", "/test2", jest.fn(), {
          auth: { authenticator: "passport", type: "jwt" },
        }),
      ];
      router.mount(routes);

      expect(router["framework"].get).toHaveBeenCalledWith(
        "/test1",
        expect.any(Array),
        expect.any(Function)
      );
      expect(router["framework"].post).toHaveBeenCalledWith(
        "/test2",
        expect.any(Array),
        expect.any(Function)
      );
    });
  });

  describe("setupMiddlewares", () => {
    it("should set up middlewares based on route options", () => {
      const options: RouteOptions = {
        auth: { authenticator: "passport", type: "jwt" },
        validation: { validator: "ajv", schema: "" },
        cors: { origin: "*" },
        limiter: { windowMs: 1000 },
        throttler: { maxRequestsPerMinute: 1 },
        middlewares: [jest.fn()],
      };
      const middlewares = router["setupMiddlewares"](options);

      expect(middlewares).toHaveLength(6);
      expect(middlewareProviders.auth.getMiddleware).toHaveBeenCalled();
      expect(middlewareProviders.validation.getMiddleware).toHaveBeenCalled();
      expect(middlewareProviders.cors.getMiddleware).toHaveBeenCalled();
      expect(middlewareProviders.limiter.getMiddleware).toHaveBeenCalled();
      expect(middlewareProviders.throttler.getMiddleware).toHaveBeenCalled();
    });

    it("should set up only custom middlewares if route options are empty", () => {
      const options: RouteOptions = {
        middlewares: [jest.fn(), jest.fn()],
      };
      const middlewares = router["setupMiddlewares"](options);

      expect(middlewares).toHaveLength(2);
    });

    it("should return empty array if route options are undefined", () => {
      const middlewares = router["setupMiddlewares"]({});

      expect(middlewares).toHaveLength(0);
    });
  });
});
