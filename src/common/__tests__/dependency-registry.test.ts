import { DependencyRegistry } from "../dependency-registry";

describe("DependencyRegistry", () => {
  const registry = new DependencyRegistry();
  beforeEach(() => {
    (registry as any).dependencies.clear();
  });

  it("should register a dependency without initialization", () => {
    registry.register("TestService");

    expect(registry.get("TestService")).toBeNull();
    expect(registry.isReady("TestService")).toBe(false);
  });

  it("should register a dependency with async initialization", async () => {
    const mockInstance = { foo: "bar" };

    registry.register("AsyncService", async () => mockInstance);
    await registry.initializeAll();

    expect(registry.get("AsyncService")).toBe(mockInstance);
    expect(registry.isReady("AsyncService")).toBe(true);
  });

  it("should initialize multiple dependencies", async () => {
    const mockDB = { connected: true };
    const mockCache = { store: "memory" };

    registry.register("Database", async () => mockDB);
    registry.register("Cache", async () => mockCache);

    await registry.initializeAll();

    expect(registry.get("Database")).toBe(mockDB);
    expect(registry.get("Cache")).toBe(mockCache);
    expect(registry.isReady("Database")).toBe(true);
    expect(registry.isReady("Cache")).toBe(true);
  });

  it("should handle initialization failures gracefully", async () => {
    registry.register("FailingService", async () => {
      throw new Error("Initialization error");
    });

    await expect(registry.initializeAll()).resolves.not.toThrow();

    expect(registry.get("FailingService")).toBeNull();
    expect(registry.isReady("FailingService")).toBe(false);
  });

  it("should return false for unregistered dependencies", () => {
    expect(registry.isReady("UnknownService")).toBe(false);
    expect(registry.get("UnknownService")).toBeNull();
  });

  it("should not override an initialized dependency with null", async () => {
    const mockInstance = { value: 42 };

    registry.register("ImmutableService", async () => mockInstance);
    await registry.initializeAll();

    registry.register("ImmutableService");

    expect(registry.get("ImmutableService")).toBe(mockInstance);
    expect(registry.isReady("ImmutableService")).toBe(true);
  });
});
