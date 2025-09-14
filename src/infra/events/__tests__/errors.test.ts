import {
  EventValidationError,
  EventParsingError,
  HandlerExecutionError
} from "../errors";

describe("Event Errors", () => {
  describe("EventValidationError", () => {
    it("should create EventValidationError with message", () => {
      const error = new EventValidationError("Validation failed");
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(EventValidationError);
      expect(error.name).toBe("EventValidationError");
      expect(error.message).toBe("Validation failed");
    });

    it("should create EventValidationError with default message", () => {
      const error = new EventValidationError();
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(EventValidationError);
      expect(error.name).toBe("EventValidationError");
      expect(error.message).toBe("");
    });

    it("should create EventValidationError with empty string message", () => {
      const error = new EventValidationError("");
      
      expect(error.message).toBe("");
    });

    it("should create EventValidationError with complex message", () => {
      const complexMessage = "Validation failed: Field 'email' is required and must be a valid email address";
      const error = new EventValidationError(complexMessage);
      
      expect(error.message).toBe(complexMessage);
    });

    it("should be throwable and catchable", () => {
      const error = new EventValidationError("Test validation error");
      
      expect(() => {
        throw error;
      }).toThrow(EventValidationError);
      
      expect(() => {
        throw error;
      }).toThrow("Test validation error");
    });

    it("should maintain stack trace", () => {
      const error = new EventValidationError("Stack trace test");
      
      expect(error.stack).toBeDefined();
      expect(typeof error.stack).toBe("string");
      expect(error.stack).toContain("EventValidationError");
    });

    it("should be serializable", () => {
      const error = new EventValidationError("Serialization test");
      const serialized = JSON.stringify({
        name: error.name,
        message: error.message
      });
      
      const parsed = JSON.parse(serialized);
      expect(parsed.name).toBe("EventValidationError");
      expect(parsed.message).toBe("Serialization test");
    });
  });

  describe("EventParsingError", () => {
    it("should create EventParsingError with message", () => {
      const error = new EventParsingError("Parsing failed");
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(EventParsingError);
      expect(error.name).toBe("EventParsingError");
      expect(error.message).toBe("Parsing failed");
    });

    it("should create EventParsingError with default message", () => {
      const error = new EventParsingError();
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(EventParsingError);
      expect(error.name).toBe("EventParsingError");
      expect(error.message).toBe("");
    });

    it("should create EventParsingError with empty string message", () => {
      const error = new EventParsingError("");
      
      expect(error.message).toBe("");
    });

    it("should create EventParsingError with complex message", () => {
      const complexMessage = "Failed to parse JSON: Unexpected token '}' at position 42";
      const error = new EventParsingError(complexMessage);
      
      expect(error.message).toBe(complexMessage);
    });

    it("should be throwable and catchable", () => {
      const error = new EventParsingError("Test parsing error");
      
      expect(() => {
        throw error;
      }).toThrow(EventParsingError);
      
      expect(() => {
        throw error;
      }).toThrow("Test parsing error");
    });

    it("should maintain stack trace", () => {
      const error = new EventParsingError("Stack trace test");
      
      expect(error.stack).toBeDefined();
      expect(typeof error.stack).toBe("string");
      expect(error.stack).toContain("EventParsingError");
    });

    it("should be serializable", () => {
      const error = new EventParsingError("Serialization test");
      const serialized = JSON.stringify({
        name: error.name,
        message: error.message
      });
      
      const parsed = JSON.parse(serialized);
      expect(parsed.name).toBe("EventParsingError");
      expect(parsed.message).toBe("Serialization test");
    });
  });

  describe("HandlerExecutionError", () => {
    it("should create HandlerExecutionError with message", () => {
      const error = new HandlerExecutionError("Handler execution failed");
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(HandlerExecutionError);
      expect(error.name).toBe("HandlerExecutionError");
      expect(error.message).toBe("Handler execution failed");
    });

    it("should create HandlerExecutionError with default message", () => {
      const error = new HandlerExecutionError();
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(HandlerExecutionError);
      expect(error.name).toBe("HandlerExecutionError");
      expect(error.message).toBe("");
    });

    it("should create HandlerExecutionError with empty string message", () => {
      const error = new HandlerExecutionError("");
      
      expect(error.message).toBe("");
    });

    it("should create HandlerExecutionError with complex message", () => {
      const complexMessage = "Handler execution failed: Database connection timeout after 30 seconds";
      const error = new HandlerExecutionError(complexMessage);
      
      expect(error.message).toBe(complexMessage);
    });

    it("should be throwable and catchable", () => {
      const error = new HandlerExecutionError("Test handler error");
      
      expect(() => {
        throw error;
      }).toThrow(HandlerExecutionError);
      
      expect(() => {
        throw error;
      }).toThrow("Test handler error");
    });

    it("should maintain stack trace", () => {
      const error = new HandlerExecutionError("Stack trace test");
      
      expect(error.stack).toBeDefined();
      expect(typeof error.stack).toBe("string");
      expect(error.stack).toContain("HandlerExecutionError");
    });

    it("should be serializable", () => {
      const error = new HandlerExecutionError("Serialization test");
      const serialized = JSON.stringify({
        name: error.name,
        message: error.message
      });
      
      const parsed = JSON.parse(serialized);
      expect(parsed.name).toBe("HandlerExecutionError");
      expect(parsed.message).toBe("Serialization test");
    });
  });

  describe("Error inheritance", () => {
    it("should all inherit from Error", () => {
      const validationError = new EventValidationError("test");
      const parsingError = new EventParsingError("test");
      const handlerError = new HandlerExecutionError("test");
      
      expect(validationError).toBeInstanceOf(Error);
      expect(parsingError).toBeInstanceOf(Error);
      expect(handlerError).toBeInstanceOf(Error);
    });

    it("should have different names", () => {
      const validationError = new EventValidationError("test");
      const parsingError = new EventParsingError("test");
      const handlerError = new HandlerExecutionError("test");
      
      expect(validationError.name).toBe("EventValidationError");
      expect(parsingError.name).toBe("EventParsingError");
      expect(handlerError.name).toBe("HandlerExecutionError");
    });

    it("should be distinguishable by instanceof", () => {
      const validationError = new EventValidationError("test");
      const parsingError = new EventParsingError("test");
      const handlerError = new HandlerExecutionError("test");
      
      expect(validationError instanceof EventValidationError).toBe(true);
      expect(validationError instanceof EventParsingError).toBe(false);
      expect(validationError instanceof HandlerExecutionError).toBe(false);
      
      expect(parsingError instanceof EventValidationError).toBe(false);
      expect(parsingError instanceof EventParsingError).toBe(true);
      expect(parsingError instanceof HandlerExecutionError).toBe(false);
      
      expect(handlerError instanceof EventValidationError).toBe(false);
      expect(handlerError instanceof EventParsingError).toBe(false);
      expect(handlerError instanceof HandlerExecutionError).toBe(true);
    });
  });

  describe("Error message handling", () => {
    it("should handle undefined message", () => {
      const error = new EventValidationError(undefined as any);
      expect(error.message).toBe("");
    });

    it("should handle null message", () => {
      const error = new EventParsingError(null as any);
      expect(error.message).toBe("null");
    });

    it("should handle number message", () => {
      const error = new HandlerExecutionError(42 as any);
      expect(error.message).toBe("42");
    });

    it("should handle object message", () => {
      const error = new EventValidationError({ test: "value" } as any);
      expect(error.message).toBe("[object Object]");
    });

    it("should handle boolean message", () => {
      const error = new EventParsingError(true as any);
      expect(error.message).toBe("true");
    });
  });

  describe("Error chaining", () => {
    it("should preserve original error in message", () => {
      const originalError = new Error("Original error");
      const wrappedError = new HandlerExecutionError(`Handler failed: ${originalError.message}`);
      
      expect(wrappedError.message).toBe("Handler failed: Original error");
    });

    it("should work with custom error types", () => {
      class CustomError extends Error {
        constructor(message: string) {
          super(message);
          this.name = "CustomError";
        }
      }
      
      const customError = new CustomError("Custom error message");
      const wrappedError = new HandlerExecutionError(`Handler failed: ${customError.message}`);
      
      expect(wrappedError.message).toBe("Handler failed: Custom error message");
    });
  });
});
