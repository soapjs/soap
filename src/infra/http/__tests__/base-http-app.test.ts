import { BaseHttpApp, Drainable } from "../base-http-app";
import { Router } from "../router";
import { Logger, NoopLogger } from "../../../common";
import { HttpPlugin } from "../types";

function makeRouter(): Router {
  return {
    initialize: () => ({} as Router),
    setupRoutes: () => undefined,
    reloadRoutes: () => Promise.resolve(),
    mount: () => ({} as Router),
  } as unknown as Router;
}

class TestApp extends BaseHttpApp {
  constructor(logger?: Logger) {
    super(makeRouter(), logger);
  }
  async start(): Promise<void> {}
  async stop(): Promise<void> {}
  getApp(): unknown {
    return {};
  }
  getServer<T>(): T {
    return {} as T;
  }
  initializeFramework(): void {}
}

describe("BaseHttpApp — Logger DI binding", () => {
  it("binds the constructor logger under Logger.Token", () => {
    const logger = new NoopLogger();
    const app = new TestApp(logger);

    expect(app.getContainer().has(Logger.Token)).toBe(true);
    expect(app.getContainer().get<Logger>(Logger.Token)).toBe(logger);
    expect(app.getLogger()).toBe(logger);
  });

  it("falls back to ConsoleLogger when no logger is supplied and still binds it", () => {
    const app = new TestApp();
    expect(app.getContainer().has(Logger.Token)).toBe(true);
    expect(app.getLogger()).toBeDefined();
  });
});

describe("BaseHttpApp — drainables", () => {
  it("registers a drainable once even on duplicate calls", () => {
    const app = new TestApp(new NoopLogger());
    const resource: Drainable = { close: jest.fn() };

    app.registerDrainable(resource);
    app.registerDrainable(resource);
    app.registerDrainable(resource);

    expect(app.getDrainables()).toEqual([resource]);
  });

  it("drains in registration order on gracefulShutdown", async () => {
    const app = new TestApp(new NoopLogger());
    const order: string[] = [];

    app.registerDrainable({
      gracefulShutdown: async () => {
        order.push("first");
      },
    });
    app.registerDrainable({
      disconnect: async () => {
        order.push("second");
      },
    });
    app.registerDrainable({
      close: async () => {
        order.push("third");
      },
    });

    await app.gracefulShutdown(["TEST"]);

    expect(order).toEqual(["first", "second", "third"]);
  });

  it("prefers gracefulShutdown() over disconnect() over close() when multiple are exposed", async () => {
    const app = new TestApp(new NoopLogger());
    const graceful = jest.fn();
    const disconnect = jest.fn();
    const close = jest.fn();

    app.registerDrainable({
      gracefulShutdown: graceful,
      disconnect,
      close,
    });

    await app.gracefulShutdown();

    expect(graceful).toHaveBeenCalledTimes(1);
    expect(disconnect).not.toHaveBeenCalled();
    expect(close).not.toHaveBeenCalled();
  });

  it("isolates a failing drainable so the rest still drain", async () => {
    const app = new TestApp(new NoopLogger());
    const first = jest.fn();
    const second = jest.fn().mockRejectedValue(new Error("boom"));
    const third = jest.fn();

    app.registerDrainable({ close: first });
    app.registerDrainable({ close: second });
    app.registerDrainable({ close: third });

    await app.gracefulShutdown();

    expect(first).toHaveBeenCalled();
    expect(second).toHaveBeenCalled();
    expect(third).toHaveBeenCalled();
  });

  it("runs drainables AFTER stop() so request handlers see live connections", async () => {
    const order: string[] = [];

    class OrderedApp extends BaseHttpApp {
      constructor() {
        super(makeRouter(), new NoopLogger());
      }
      async start(): Promise<void> {}
      async stop(): Promise<void> {
        order.push("stop");
      }
      getApp(): unknown {
        return {};
      }
      getServer<T>(): T {
        return {} as T;
      }
      initializeFramework(): void {}
    }

    const app = new OrderedApp();
    app.registerDrainable({
      close: async () => {
        order.push("drain");
      },
    });

    await app.gracefulShutdown();
    expect(order).toEqual(["stop", "drain"]);
  });

  it("runs plugin gracefulShutdown BEFORE stop() so health probes can flip to draining first", async () => {
    const order: string[] = [];

    class OrderedApp extends BaseHttpApp {
      constructor() {
        super(makeRouter(), new NoopLogger());
      }
      async start(): Promise<void> {}
      async stop(): Promise<void> {
        order.push("stop");
      }
      getApp(): unknown {
        return {};
      }
      getServer<T>(): T {
        return {} as T;
      }
      initializeFramework(): void {}
    }

    const plugin = {
      name: "test-plugin",
      version: "0.0.1",
      install: async () => undefined,
      uninstall: () => undefined,
      gracefulShutdown: async () => {
        order.push("plugin");
      },
    } as unknown as HttpPlugin;

    const app = new OrderedApp();
    app.usePlugin(plugin);
    app.registerDrainable({
      close: async () => {
        order.push("drain");
      },
    });

    await app.gracefulShutdown();
    expect(order).toEqual(["plugin", "stop", "drain"]);
  });
});
