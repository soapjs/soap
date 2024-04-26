import {
  Throttler,
  ThrottlerOptions,
} from "../middlewares/throttler/throttler";
import { ThrottlerMiddlewareProvider } from "../middlewares/throttler/throttler.middleware-provider";

class MockThrottler implements Throttler {
  checkRequest(request: any, options: ThrottlerOptions): boolean {
    return options.maxRequestsPerSecond && options.maxRequestsPerSecond >= 2;
  }
}

describe("ThrottlerMiddlewareProvider", () => {
  let mockResponse: any;

  beforeEach(() => {
    mockResponse = {
      status: jest.fn(() => mockResponse),
      send: jest.fn(),
    };
  });

  it("should allow the request if throttler allows", () => {
    const throttlerMiddlewareProvider = new ThrottlerMiddlewareProvider(
      new MockThrottler()
    );

    const mockRequest: any = {};

    const options: ThrottlerOptions = {
      maxRequestsPerSecond: 2,
    };

    const middleware = throttlerMiddlewareProvider.getMiddleware(options);

    const mockNext = jest.fn();

    middleware(mockRequest, mockResponse, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockResponse.status).not.toHaveBeenCalled();
    expect(mockResponse.send).not.toHaveBeenCalled();
  });

  it("should reject the request if throttler rejects", () => {
    const throttlerMiddlewareProvider = new ThrottlerMiddlewareProvider(
      new MockThrottler()
    );

    const mockRequest: any = {};

    const options: ThrottlerOptions = {
      maxRequestsPerSecond: 1,
    };

    const middleware = throttlerMiddlewareProvider.getMiddleware(options);

    const mockNext = jest.fn();

    middleware(mockRequest, mockResponse, mockNext);

    expect(mockNext).not.toHaveBeenCalled();
    expect(mockResponse.status).toHaveBeenCalledWith(429);
    expect(mockResponse.send).toHaveBeenCalledWith("Too Many Requests");
  });
});
