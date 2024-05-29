import { ConfigVars, UndefinedEnviromentVariableError } from "../config-vars";

describe("ConfigVars", () => {
  describe("getEnv", () => {
    it("should return value from process.env if exists", () => {
      process.env.TEST_VAR = "test_value";
      const configVars = new ConfigVars();
      expect(configVars["getEnv"]("TEST_VAR", false)).toEqual("test_value");
      delete process.env.TEST_VAR;
    });

    it("should return value from .env file if exists and process.env does not contain the variable", () => {
      const configVars = new ConfigVars(`${__dirname}/.env.test`);
      expect(configVars["getEnv"]("TEST_VAR", false)).toEqual("test_value");
    });

    it("should return undefined if variable does not exist in process.env or .env file", () => {
      const configVars = new ConfigVars();
      expect(configVars["getEnv"]("NON_EXISTENT_VAR", false)).toBeUndefined();
    });

    it("should throw error if variable does not exist in process.env or .env file and marked as required", () => {
      try {
        const configVars = new ConfigVars();
        configVars["getEnv"]("NON_EXISTENT_VAR", true);
      } catch (error) {
        expect(error).toBeInstanceOf(UndefinedEnviromentVariableError);
      }
    });
  });

  describe("getNumberEnv", () => {
    it("should return value as a number if it can be converted", () => {
      process.env.NUMBER_VAR = "42";
      const configVars = new ConfigVars();
      expect(configVars["getNumberEnv"]("NUMBER_VAR")).toEqual(42);
      delete process.env.NUMBER_VAR;
    });

    it("should return NaN if value cannot be converted to a number", () => {
      process.env.NUMBER_VAR = "not_a_number";
      const configVars = new ConfigVars();
      expect(configVars["getNumberEnv"]("NUMBER_VAR")).toBeNaN();
      delete process.env.NUMBER_VAR;
    });

    it("should return NaN if variable does not exist in process.env or .env file", () => {
      const configVars = new ConfigVars();
      expect(configVars["getNumberEnv"]("NON_EXISTENT_VAR")).toBeNaN();
    });
  });

  describe("getBooleanEnv", () => {
    it('should return true if value is "true"', () => {
      process.env.BOOL_VAR = "true";
      const configVars = new ConfigVars();
      expect(configVars["getBooleanEnv"]("BOOL_VAR")).toBe(true);
      delete process.env.BOOL_VAR;
    });

    it('should return false if value is "false"', () => {
      process.env.BOOL_VAR = "false";
      const configVars = new ConfigVars();
      expect(configVars["getBooleanEnv"]("BOOL_VAR")).toBe(false);
      delete process.env.BOOL_VAR;
    });

    it("should return null if value cannot be converted to a boolean", () => {
      const configVars = new ConfigVars();
      expect(configVars["getBooleanEnv"]("NUMBER_VAR")).toBeNull();
    });
  });

  describe("getArrayEnv", () => {
    it("should return an array of strings if value is a comma-separated list", () => {
      process.env.ARRAY_VAR = "value1,value2,value3";
      const configVars = new ConfigVars();
      expect(configVars["getArrayEnv"]("ARRAY_VAR")).toEqual([
        "value1",
        "value2",
        "value3",
      ]);
      delete process.env.ARRAY_VAR;
    });

    it("should return an empty array if value is not defined", () => {
      const configVars = new ConfigVars();
      expect(configVars["getArrayEnv"]("NON_EXISTENT_VAR")).toEqual([]);
    });
  });
});
