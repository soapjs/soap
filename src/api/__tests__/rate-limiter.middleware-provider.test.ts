import {
  RateLimiter,
  RateLimiterOptions,
} from "../middlewares/rate-limiter/rate-limiter";
import { RateLimiterMiddlewareProvider } from "../middlewares/rate-limiter/rate-limiter.middleware-provider";
import { RouteRequest } from "../route.types";
import { WebFrameworkMiddleware } from "../web-framework";

class MockRateLimiter implements RateLimiter {
  checkRequest(request: RouteRequest, options: RateLimiterOptions): boolean {
    return true;
  }
}

describe("RateLimiterMiddlewareProvider", () => {
  let rateLimiterMiddlewareProvider: RateLimiterMiddlewareProvider;
  let mockRateLimiter: RateLimiter;

  beforeEach(() => {
    mockRateLimiter = new MockRateLimiter();
    rateLimiterMiddlewareProvider = new RateLimiterMiddlewareProvider(
      mockRateLimiter
    );
  });

  describe("getMiddleware", () => {
    it("should return middleware function for rate limiting", () => {
      const options: RateLimiterOptions = {
        maxRequests: 100,
        windowMs: 60000,
        mandatory: true,
      };
      const middleware: WebFrameworkMiddleware =
        rateLimiterMiddlewareProvider.getMiddleware(options);

      expect(typeof middleware).toBe("function");
    });

    it("should allow request if rate limiting check passes", () => {
      const options: RateLimiterOptions = {
        maxRequests: 100,
        windowMs: 60000,
        mandatory: true,
      };
      const middleware: WebFrameworkMiddleware =
        rateLimiterMiddlewareProvider.getMiddleware(options);
      const request: any = {};
      const response: any = {};
      const next: any = jest.fn();

      middleware(request, response, next);

      expect(next).toHaveBeenCalled();
    });

    it("should block request if rate limiting check fails", () => {
      const options: RateLimiterOptions = {
        maxRequests: 100,
        windowMs: 60000,
        mandatory: true,
      };
      const middleware: WebFrameworkMiddleware =
        rateLimiterMiddlewareProvider.getMiddleware(options);
      const request: any = {};
      const response: any = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
      };
      const next: any = jest.fn();

      jest.spyOn(mockRateLimiter, "checkRequest").mockReturnValue(false);

      middleware(request, response, next);

      expect(response.status).toHaveBeenCalledWith(429);
      expect(response.send).toHaveBeenCalledWith("Too Many Requests");
      expect(next).not.toHaveBeenCalled();
    });
  });
});
