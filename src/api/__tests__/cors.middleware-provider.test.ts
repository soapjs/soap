import { Cors, CorsOptions } from "../middlewares/cors/cors";
import { CorsMiddlewareProvider } from "../middlewares/cors/cors.middleware-provider";
import { RouteRequest, RouteResponse } from "../route.types";
import { WebFrameworkMiddleware } from "../web-framework";

class MockCors implements Cors {
  apply(
    request: RouteRequest,
    response: RouteResponse,
    options: CorsOptions
  ): void {
    response.setHeader("Access-Control-Allow-Origin", "*");
    response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    response.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );
    response.setHeader("Access-Control-Allow-Credentials", "true");
    response.setHeader("Access-Control-Max-Age", "86400");
  }
}

describe("CorsMiddlewareProvider", () => {
  let corsMiddlewareProvider: CorsMiddlewareProvider;
  let mockCors: Cors;

  beforeEach(() => {
    mockCors = new MockCors();
    corsMiddlewareProvider = new CorsMiddlewareProvider(mockCors);
  });

  describe("getMiddleware", () => {
    it("should return middleware function for CORS", () => {
      const options: CorsOptions = {
        origin: "*",
        methods: ["GET", "POST", "OPTIONS"],
        headers: ["Content-Type", "Authorization"],
        credentials: true,
        maxAge: 86400,
      };
      const middleware: WebFrameworkMiddleware =
        corsMiddlewareProvider.getMiddleware(options);

      expect(typeof middleware).toBe("function");
    });

    it("should apply CORS headers to the response", () => {
      const options: CorsOptions = {
        origin: "*",
        methods: ["GET", "POST", "OPTIONS"],
        headers: ["Content-Type", "Authorization"],
        credentials: true,
        maxAge: 86400,
      };
      const middleware: WebFrameworkMiddleware =
        corsMiddlewareProvider.getMiddleware(options);
      const request: any = {};
      const response: any = {
        setHeader: jest.fn(),
      };
      const next: any = jest.fn();

      middleware(request, response, next);

      expect(response.setHeader).toHaveBeenCalledWith(
        "Access-Control-Allow-Origin",
        "*"
      );
      expect(response.setHeader).toHaveBeenCalledWith(
        "Access-Control-Allow-Methods",
        "GET, POST, OPTIONS"
      );
      expect(response.setHeader).toHaveBeenCalledWith(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization"
      );
      expect(response.setHeader).toHaveBeenCalledWith(
        "Access-Control-Allow-Credentials",
        "true"
      );
      expect(response.setHeader).toHaveBeenCalledWith(
        "Access-Control-Max-Age",
        "86400"
      );
    });

    it("should call next middleware after applying CORS headers", () => {
      const options: CorsOptions = {
        origin: "*",
        methods: ["GET", "POST", "OPTIONS"],
        headers: ["Content-Type", "Authorization"],
        credentials: true,
        maxAge: 86400,
      };
      const middleware: WebFrameworkMiddleware =
        corsMiddlewareProvider.getMiddleware(options);
      const request: any = {};
      const response: any = { setHeader: (...args: any[]) => jest.fn() };
      const next: any = jest.fn();

      middleware(request, response, next);

      expect(next).toHaveBeenCalled();
    });
  });
});
