import { Auth, AuthOptions } from "../middlewares/auth/auth";
import { AuthMiddlewareProvider } from "../middlewares/auth/auth.middleware-provider";
import { RouteRequest } from "../route.types";
import { WebFrameworkMiddleware } from "../web-framework";

class MockAuth implements Auth {
  initializeAuthenticator(type: string): void {}
  hasAuthenticator(type: string): boolean {
    return true;
  }
  authenticate(request: RouteRequest, options: AuthOptions): boolean {
    return true;
  }
}

describe("AuthMiddlewareProvider", () => {
  let authMiddlewareProvider: AuthMiddlewareProvider;
  let mockAuth: Auth;

  beforeEach(() => {
    mockAuth = new MockAuth();
    authMiddlewareProvider = new AuthMiddlewareProvider(mockAuth);
  });

  describe("getMiddleware", () => {
    it("should return middleware function for authentication", () => {
      const options: AuthOptions = {
        authenticator: "example",
        type: "basic",
      };
      const middleware: WebFrameworkMiddleware =
        authMiddlewareProvider.getMiddleware(options);

      expect(typeof middleware).toBe("function");
    });

    it("should authenticate request if authentication is successful", () => {
      const options: AuthOptions = {
        authenticator: "example",
        type: "basic",
      };
      const middleware: WebFrameworkMiddleware =
        authMiddlewareProvider.getMiddleware(options);
      const request: any = {};
      const response: any = {};
      const next: any = jest.fn();

      middleware(request, response, next);

      expect(next).toHaveBeenCalled();
    });

    it("should send unauthorized response if authentication fails", () => {
      mockAuth.authenticate = jest.fn().mockReturnValue(false);

      const options: AuthOptions = {
        authenticator: "example",
        type: "basic",
      };
      const middleware: WebFrameworkMiddleware =
        authMiddlewareProvider.getMiddleware(options);
      const request: any = {};
      const response: any = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };
      const next: any = jest.fn();

      middleware(request, response, next);

      expect(response.status).toHaveBeenCalledWith(401);
      expect(response.send).toHaveBeenCalledWith("Unauthorized");
    });
  });
});
