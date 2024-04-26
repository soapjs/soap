import { Container } from "../container";

describe("Container", () => {
  let container: Container;

  beforeEach(() => {
    container = new Container();
  });

  it("should bind a value to a key", () => {
    container.bind("key", "value");
    expect(container.has("key")).toBe(true);
  });

  it("should return true when a value is bound to a key", () => {
    container.bind("key", "value");
    expect(container.has("key")).toBe(true);
  });

  it("should return false when no value is bound to a key", () => {
    expect(container.has("key")).toBe(false);
  });

  it("should retrieve a value bound to a key", () => {
    container.bind("key", "value");
    expect(container.get("key")).toBe("value");
  });

  it("should return undefined when no value is bound to a key", () => {
    expect(container.get("key")).toBeUndefined();
  });
});
