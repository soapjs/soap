import { DependencyRegistry } from "../dependency-registry";

describe("DependencyRegistry", () => {
  beforeEach(() => {
    (DependencyRegistry as any).dependencies.clear();
  });

  it("should register a dependency without initialization", () => {
    DependencyRegistry.register("TestService");

    expect(DependencyRegistry.get("TestService")).toBeNull();
    expect(DependencyRegistry.isReady("TestService")).toBe(false);
  });

  it("should register a dependency with async initialization", async () => {
    const mockInstance = { foo: "bar" };

    DependencyRegistry.register("AsyncService", async () => mockInstance);
    await DependencyRegistry.initializeAll();

    expect(DependencyRegistry.get("AsyncService")).toBe(mockInstance);
    expect(DependencyRegistry.isReady("AsyncService")).toBe(true);
  });

  it("should initialize multiple dependencies", async () => {
    const mockDB = { connected: true };
    const mockCache = { store: "memory" };

    DependencyRegistry.register("Database", async () => mockDB);
    DependencyRegistry.register("Cache", async () => mockCache);

    await DependencyRegistry.initializeAll();

    expect(DependencyRegistry.get("Database")).toBe(mockDB);
    expect(DependencyRegistry.get("Cache")).toBe(mockCache);
    expect(DependencyRegistry.isReady("Database")).toBe(true);
    expect(DependencyRegistry.isReady("Cache")).toBe(true);
  });

  it("should handle initialization failures gracefully", async () => {
    DependencyRegistry.register("FailingService", async () => {
      throw new Error("Initialization error");
    });

    await expect(DependencyRegistry.initializeAll()).resolves.not.toThrow();

    expect(DependencyRegistry.get("FailingService")).toBeNull();
    expect(DependencyRegistry.isReady("FailingService")).toBe(false);
  });

  it("should return false for unregistered dependencies", () => {
    expect(DependencyRegistry.isReady("UnknownService")).toBe(false);
    expect(DependencyRegistry.get("UnknownService")).toBeNull();
  });

  it("should not override an initialized dependency with null", async () => {
    const mockInstance = { value: 42 };

    DependencyRegistry.register("ImmutableService", async () => mockInstance);
    await DependencyRegistry.initializeAll();

    DependencyRegistry.register("ImmutableService");

    expect(DependencyRegistry.get("ImmutableService")).toBe(mockInstance);
    expect(DependencyRegistry.isReady("ImmutableService")).toBe(true);
  });
});
