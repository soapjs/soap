import {
  AuthConfig,
  AuthRequest,
  AuthResult,
  AuthState,
  AuthStrategy,
  AuthUser,
  HttpContext,
} from "../types";

interface TestUser extends AuthUser {
  tenantId: string;
}

interface TestAuthContext extends HttpContext {
  storage: {
    get(key: string): Promise<string | undefined>;
  };
}

describe("HTTP auth contracts", () => {
  it("allows rich auth state on AuthRequest without losing the legacy fields", () => {
    const result: AuthResult<TestUser> = {
      user: {
        id: "user-1",
        email: "user@example.com",
        tenantId: "tenant-1",
      },
      tokens: {
        accessToken: "access-token",
        refreshToken: "refresh-token",
      },
      session: {
        sessionId: "session-1",
        data: { csrf: "csrf-token" },
      },
    };

    const auth: AuthState<TestUser> = {
      token: "access-token",
      type: "jwt",
      payload: { sub: "user-1" },
      result,
      tokens: result.tokens,
      session: result.session,
    };

    const request: AuthRequest<TestUser> = {
      user: result.user,
      auth,
    };

    expect(request.auth?.token).toBe("access-token");
    expect(request.auth?.result?.user.tenantId).toBe("tenant-1");
    expect(request.auth?.tokens?.refreshToken).toBe("refresh-token");
    expect(request.auth?.session?.sessionId).toBe("session-1");
  });

  it("allows auth strategies to use adapter-specific context shapes", async () => {
    const strategy: AuthStrategy<TestUser, TestAuthContext> = {
      name: "test",
      async authenticate(ctx) {
        const tenantId = await ctx.storage.get("tenantId");

        return {
          user: {
            id: "user-1",
            tenantId: tenantId || "default",
          },
        };
      },
    };

    const config: AuthConfig<TestUser, TestAuthContext> = {
      strategies: [strategy],
      defaultStrategy: "test",
    };

    const context: TestAuthContext = {
      req: {
        method: "GET",
        path: "/",
        headers: {},
      },
      res: {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        cookie: jest.fn().mockReturnThis(),
        setHeader: jest.fn().mockReturnThis(),
      },
      next: jest.fn(),
      storage: {
        get: jest.fn().mockResolvedValue("tenant-1"),
      },
    };

    const result = await config.strategies[0].authenticate(context);

    expect(result?.user.tenantId).toBe("tenant-1");
  });
});
