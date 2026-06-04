import { ConsoleLogger, Logger, NoopLogger } from "../logger";

describe("ConsoleLogger", () => {
  let output: string[];
  const sink = (line: string) => {
    output.push(line);
  };

  beforeEach(() => {
    output = [];
  });

  describe("pretty format", () => {
    let logger: ConsoleLogger;
    beforeEach(() => {
      logger = new ConsoleLogger({ format: "pretty", write: sink });
    });

    it("formats every level with [level] prefix", () => {
      logger.info("hi");
      logger.warn("careful");
      logger.error("boom");
      logger.debug("nope"); // info-level by default → dropped

      expect(output).toEqual([
        "[info] hi",
        "[warn] careful",
        "[error] boom",
      ]);
    });

    it("renders Error.stack + name when error() receives an Error", () => {
      const err = new Error("kaboom");
      logger.error(err);

      expect(output).toHaveLength(1);
      expect(output[0]).toContain("[error] kaboom");
      expect(output[0]).toContain("stack=");
      expect(output[0]).toContain("name=Error");
    });

    it("appends extra args to the rendered line", () => {
      logger.info("ping", 42, { foo: "bar" });
      expect(output[0]).toContain("[info] ping");
      expect(output[0]).toContain("42");
      expect(output[0]).toContain('{"foo":"bar"}');
    });

    it("includes context bindings on every record", () => {
      const child = new ConsoleLogger({
        format: "pretty",
        write: sink,
        context: { service: "api", region: "eu" },
      });
      child.info("ready");
      expect(output[0]).toBe('[info] ready service="api" region="eu"');
    });
  });

  describe("json format", () => {
    let logger: ConsoleLogger;
    beforeEach(() => {
      logger = new ConsoleLogger({ format: "json", write: sink });
    });

    it("emits a single-line JSON record per call", () => {
      logger.info("hello", { extra: 1 });

      expect(output).toHaveLength(1);
      const record = JSON.parse(output[0]);
      expect(record).toMatchObject({ level: "info", message: "hello" });
      expect(record.args).toEqual([{ extra: 1 }]);
      expect(record.time).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it("includes context bindings in the record body", () => {
      const child = new ConsoleLogger({
        format: "json",
        write: sink,
        context: { requestId: "abc-123" },
      });
      child.warn("slow");
      expect(JSON.parse(output[0])).toMatchObject({
        level: "warn",
        message: "slow",
        requestId: "abc-123",
      });
    });

    it("survives records that contain circular references", () => {
      const circular: Record<string, unknown> = {};
      circular.self = circular;

      logger.info("loop", circular);

      expect(output).toHaveLength(1);
      const record = JSON.parse(output[0]);
      expect(record.level).toBe("info");
      expect(record.message).toBe("loop");
      // `args` is dropped on the retry path — what matters is we didn't throw.
      expect(record.args).toBeUndefined();
    });
  });

  describe("level filtering", () => {
    it("drops records below the configured level", () => {
      const logger = new ConsoleLogger({
        format: "json",
        write: sink,
        level: "warn",
      });
      logger.info("noise");
      logger.debug("more noise");
      logger.warn("see me");
      logger.error("see me too");

      expect(output.map((line) => JSON.parse(line).level)).toEqual([
        "warn",
        "error",
      ]);
    });

    it("falls back to info when log() receives an unknown level", () => {
      const logger = new ConsoleLogger({ format: "pretty", write: sink });
      logger.log("trace", "anything");
      expect(output[0]).toBe("[info] [trace] anything");
    });
  });

  describe("child()", () => {
    it("merges parent + child bindings without mutating the parent", () => {
      const parent = new ConsoleLogger({
        format: "json",
        write: sink,
        context: { service: "api" },
      });
      const child = parent.child!({ requestId: "r-1" });

      parent.info("parent");
      child.info("child");

      const records = output.map((l) => JSON.parse(l));
      expect(records[0]).toEqual(
        expect.objectContaining({ service: "api", message: "parent" }),
      );
      expect(records[0].requestId).toBeUndefined();
      expect(records[1]).toEqual(
        expect.objectContaining({
          service: "api",
          requestId: "r-1",
          message: "child",
        }),
      );
    });

    it("child overrides parent bindings on key collision", () => {
      const parent = new ConsoleLogger({
        format: "json",
        write: sink,
        context: { service: "api" },
      });
      const child = parent.child!({ service: "worker" });
      child.info("hello");
      expect(JSON.parse(output[0]).service).toBe("worker");
    });
  });
});

describe("Logger.Token", () => {
  it("exposes a stable DI token", () => {
    expect(Logger.Token).toBe("Logger");
  });
});

describe("NoopLogger", () => {
  it("never writes anything regardless of method", () => {
    const writeSpy = jest.spyOn(process.stdout, "write");
    const logger = new NoopLogger();
    logger.info("hi");
    logger.error("boom");
    logger.log("info", "x");
    logger.child({ x: 1 }).info("nope");

    // We can't strictly assert "0 writes" because Jest reporters write,
    // but we *can* assert NoopLogger didn't emit a JSON record.
    const noopLines = writeSpy.mock.calls
      .map(([c]) => String(c))
      .filter((c) => c.includes('"message":"hi"') || c.includes('"boom"'));
    expect(noopLines).toEqual([]);
    writeSpy.mockRestore();
  });

  it("child() returns itself so chained calls still drop everything", () => {
    const logger = new NoopLogger();
    expect(logger.child({ a: 1 })).toBe(logger);
  });
});
