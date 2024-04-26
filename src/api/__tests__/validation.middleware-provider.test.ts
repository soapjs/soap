import {
  Validation,
  ValidationOptions,
  ValidationResult,
} from "../middlewares/validation/validation";
import { ValidationMiddlewareProvider } from "../middlewares/validation/validation.middleware-provider";

class MockValidation implements Validation {
  validate(request: any, ...args: any[]): ValidationResult {
    return request.name
      ? { valid: true }
      : { valid: false, message: "Missing name property" };
  }
}

describe("ValidationMiddlewareProvider", () => {
  let mockResponse: any;

  beforeEach(() => {
    mockResponse = {
      status: jest.fn(() => mockResponse),
      send: jest.fn(),
    };
  });

  it("should allow the request if validation passes", () => {
    const validationMiddlewareProvider = new ValidationMiddlewareProvider(
      new MockValidation()
    );

    const mockRequest: any = { name: "John" };

    const options: ValidationOptions = {
      validator: "mock",
      schema: {},
    };

    const middleware = validationMiddlewareProvider.getMiddleware(options);

    const mockNext = jest.fn();

    middleware(mockRequest, mockResponse, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockResponse.status).not.toHaveBeenCalled();
    expect(mockResponse.send).not.toHaveBeenCalled();
  });

  it("should reject the request if validation fails", () => {
    const validationMiddlewareProvider = new ValidationMiddlewareProvider(
      new MockValidation()
    );

    const mockRequest: any = {};

    const options: ValidationOptions = {
      validator: "mock",
      schema: {},
    };

    const middleware = validationMiddlewareProvider.getMiddleware(options);

    const mockNext = jest.fn();

    middleware(mockRequest, mockResponse, mockNext);

    expect(mockNext).not.toHaveBeenCalled();
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.send).toHaveBeenCalledWith({
      valid: false,
      message: "Missing name property",
    });
  });
});
