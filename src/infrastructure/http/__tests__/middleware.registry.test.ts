import { Middleware } from "../middleware";
import { MiddlewareRegistry, MiddlewareType } from "../middleware.registry";

describe("MiddlewareRegistry", () => {
  let registry: MiddlewareRegistry;
  let logger: { warn: jest.Mock };

  beforeEach(() => {
    logger = { warn: jest.fn() };
    registry = new MiddlewareRegistry();
  });

  it("should add middleware to the registry", () => {
    const middleware: Middleware = {
      name: MiddlewareType.Security,
      isDynamic: true,
      use: jest.fn(),
    };
    registry.add(middleware);

    expect(registry["list"].has(MiddlewareType.Security)).toBe(true);
  });

  it("should initialize middleware if not ready", () => {
    const init = jest.fn();
    const middleware: Middleware = {
      name: MiddlewareType.Security,
      isDynamic: false,
      init,
      use: jest.fn(),
    };
    registry.add(middleware);

    registry.init(MiddlewareType.Security, "arg1", "arg2");

    expect(init).toHaveBeenCalledTimes(1);
    expect(init).toHaveBeenCalledWith("arg1", "arg2");
    expect(registry["list"].get(MiddlewareType.Security)?.ready).toBe(true);
  });

  it("should throw an error if middleware is not found", () => {
    expect(() => registry.use(MiddlewareType.Security)).toThrow(
      "Middleware security not found"
    );
  });

  it("should throw an error if middleware is not ready", () => {
    const middleware: Middleware = {
      name: MiddlewareType.Security,
      isDynamic: false,
      use: jest.fn(),
    };
    registry.add(middleware);

    expect(() => registry.use(MiddlewareType.Security)).toThrow(
      "Middleware security not ready"
    );
  });

  it("should use middleware if ready", () => {
    const use = jest.fn();
    const middleware: Middleware = {
      name: MiddlewareType.Security,
      isDynamic: true,
      use,
    };
    registry.add(middleware);

    registry.use(MiddlewareType.Security, "arg1", "arg2");

    expect(use).toHaveBeenCalledTimes(1);
    expect(use).toHaveBeenCalledWith("arg1", "arg2");
  });
});
