import fs from "fs";
import path from "path";

jest.mock("fs");
import { parseEnvFile, readEnvFile } from "../config.utils";

describe("parseEnvFile", () => {
  it("parses key-value pairs from an env file buffer", () => {
    const buffer = Buffer.from("FOO=bar\nBAZ=qux");
    const expected = { FOO: "bar", BAZ: "qux" };
    expect(parseEnvFile(buffer)).toEqual(expected);
  });

  it("parses key-value pairs from an env file string", () => {
    const envString = "FOO=bar\nBAZ=qux";
    const expected = { FOO: "bar", BAZ: "qux" };
    expect(parseEnvFile(envString)).toEqual(expected);
  });

  it("parses key-value pairs with quoted values", () => {
    const envString = "FOO=\"bar\"\nBAZ='qux'\nQUUX=`baz`";
    const expected = { FOO: "bar", BAZ: "qux", QUUX: "baz" };
    expect(parseEnvFile(envString)).toEqual(expected);
  });

  it("parses key-value pairs with special characters in values", () => {
    const envString = "FOO=ba\\r\nBAR=ba\\n\\z";
    const expected = { FOO: "ba\\r", BAR: "ba\\n\\z" };
    expect(parseEnvFile(envString)).toEqual(expected);
  });
});

describe("readEnvFile", () => {
  it("reads and parses key-value pairs from an env file", () => {
    const envPath = path.resolve(__dirname, ".env.test");
    const envContent = "FOO=bar\nBAZ=qux";
    jest.spyOn(fs, "readFileSync").mockReturnValueOnce(envContent);
    const expected = { FOO: "bar", BAZ: "qux" };
    expect(readEnvFile(envPath)).toEqual(expected);
  });

  it("reads and parses key-value pairs from default env file", () => {
    const envContent = "FOO=bar\nBAZ=qux";
    jest.spyOn(fs, "readFileSync").mockReturnValueOnce(envContent);
    const expected = { FOO: "bar", BAZ: "qux" };
    expect(readEnvFile()).toEqual(expected);
  });

  it("returns an empty object if an error occurs during file reading", () => {
    jest.spyOn(fs, "readFileSync").mockImplementationOnce(() => {
      throw new Error("File not found");
    });
    expect(readEnvFile()).toEqual({});
  });
});
