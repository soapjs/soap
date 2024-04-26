import { Singleton } from "../singleton";

describe("Singleton", () => {
  it("should bind a value to a key", () => {
    Singleton.bind("key", "value");
    expect(Singleton["container"].has("key")).toBe(true);
  });

  it("should retrieve a value bound to a key", () => {
    Singleton.bind("key", "value");
    expect(Singleton.get("key")).toBe("value");
  });

  it("should throw an error when getting a value for an unregistered key", () => {
    expect(() => Singleton.get("unknown_key")).toThrowError(
      "Dependency 'unknown_key' not registered"
    );
  });
});
