import { ConsoleLogger } from "../logger";

describe("ConsoleLogger", () => {
  let logger: ConsoleLogger;

  beforeEach(() => {
    logger = new ConsoleLogger();
    console.log = jest.fn();
    console.error = jest.fn();
    console.warn = jest.fn();
    console.info = jest.fn();
    console.debug = jest.fn();
  });

  it("should log messages with specified levels", () => {
    logger.log("info", "test message");
    expect(console.log).toHaveBeenCalledWith("[info]", "test message");
  });

  it("should log error messages", () => {
    logger.error("error message");
    expect(console.error).toHaveBeenCalledWith("error message");
  });

  it("should log warning messages", () => {
    logger.warn("warning message");
    expect(console.warn).toHaveBeenCalledWith("warning message");
  });

  it("should log informational messages", () => {
    logger.info("info message");
    expect(console.info).toHaveBeenCalledWith("info message");
  });

  it("should log HTTP messages", () => {
    logger.http("http message");
    expect(console.log).toHaveBeenCalledWith("http message");
  });

  it("should log verbose messages", () => {
    logger.verbose("verbose message");
    expect(console.log).toHaveBeenCalledWith("verbose message");
  });

  it("should log debug messages", () => {
    logger.debug("debug message");
    expect(console.debug).toHaveBeenCalledWith("debug message");
  });
});
