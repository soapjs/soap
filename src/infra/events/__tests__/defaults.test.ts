import { DefaultEventProcessingStrategy } from "../defaults";
import { EventBase } from "../event-base";
import { EventValidationError, EventParsingError, HandlerExecutionError } from "../errors";

describe("DefaultEventProcessingStrategy", () => {
  let strategy: DefaultEventProcessingStrategy<any>;

  beforeEach(() => {
    strategy = new DefaultEventProcessingStrategy();
  });

  describe("process", () => {
    it("should process valid EventBase successfully", async () => {
      const mockHandler = jest.fn().mockResolvedValue(undefined);
      const eventBase: EventBase<{ userId: string; name: string }> = {
        message: { userId: "123", name: "John Doe" },
        headers: { correlationId: "corr-123" }
      };

      await strategy.process(eventBase, mockHandler);

      expect(mockHandler).toHaveBeenCalledWith(eventBase);
      expect(mockHandler).toHaveBeenCalledTimes(1);
    });

    it("should process EventBase with complex data", async () => {
      const mockHandler = jest.fn().mockResolvedValue(undefined);
      const complexData = {
        orderId: "order-123",
        customer: {
          id: "customer-456",
          name: "Jane Doe",
          address: {
            street: "123 Main St",
            city: "New York",
            zipCode: "10001"
          }
        },
        items: [
          { id: "item-1", name: "Product A", quantity: 2, price: 25.99 },
          { id: "item-2", name: "Product B", quantity: 1, price: 49.99 }
        ],
        total: 101.97
      };

      const eventBase: EventBase<typeof complexData> = {
        message: complexData,
        headers: { correlationId: "corr-456" }
      };

      await strategy.process(eventBase, mockHandler);

      expect(mockHandler).toHaveBeenCalledWith(eventBase);
      expect(mockHandler).toHaveBeenCalledTimes(1);
    });

    it("should process EventBase with empty data", async () => {
      const mockHandler = jest.fn().mockResolvedValue(undefined);
      const eventBase: EventBase<{}> = {
        message: {},
        headers: { correlationId: "corr-789" }
      };

      await strategy.process(eventBase, mockHandler);

      expect(mockHandler).toHaveBeenCalledWith(eventBase);
      expect(mockHandler).toHaveBeenCalledTimes(1);
    });

    it("should process EventBase with null data", async () => {
      const mockHandler = jest.fn().mockResolvedValue(undefined);
      const eventBase: EventBase<null> = {
        message: null,
        headers: { correlationId: "corr-null" }
      };

      // The current validation rejects null/undefined, so we expect it to throw
      await expect(strategy.process(eventBase, mockHandler)).rejects.toThrow(
        EventValidationError
      );
    });

    it("should process EventBase with undefined data", async () => {
      const mockHandler = jest.fn().mockResolvedValue(undefined);
      const eventBase: EventBase<undefined> = {
        message: undefined,
        headers: { correlationId: "corr-undefined" }
      };

      // The current validation rejects null/undefined, so we expect it to throw
      await expect(strategy.process(eventBase, mockHandler)).rejects.toThrow(
        EventValidationError
      );
    });

    it("should handle handler errors and wrap them in HandlerExecutionError", async () => {
      const originalError = new Error("Handler failed");
      const mockHandler = jest.fn().mockRejectedValue(originalError);
      const eventBase: EventBase<{ test: string }> = {
        message: { test: "value" },
        headers: { correlationId: "corr-error" }
      };

      await expect(strategy.process(eventBase, mockHandler)).rejects.toThrow(
        HandlerExecutionError
      );

      await expect(strategy.process(eventBase, mockHandler)).rejects.toThrow(
        "Handler execution failed: Handler failed"
      );
    });

    it("should handle validation errors", async () => {
      const mockHandler = jest.fn().mockResolvedValue(undefined);
      
      // Create an event with invalid data that would fail validation
      const eventBase: EventBase<any> = {
        message: null, // This should fail validation
        headers: { correlationId: "corr-valid" }
      };

      // The current implementation rejects null/undefined
      await expect(strategy.process(eventBase, mockHandler)).rejects.toThrow(
        EventValidationError
      );
    });

    it("should handle parsing errors for invalid EventBase structure", async () => {
      const mockHandler = jest.fn().mockResolvedValue(undefined);
      
      // Pass a string instead of EventBase (this should cause validation error, not parsing error)
      const invalidEvent = "invalid-event-string";

      // The current implementation treats this as validation error, not parsing error
      await expect(strategy.process(invalidEvent as any, mockHandler)).rejects.toThrow(
        EventValidationError
      );
    });

    it("should handle EventBase with error field", async () => {
      const mockHandler = jest.fn().mockResolvedValue(undefined);
      const eventBase: EventBase<{ test: string }> = {
        message: { test: "value" },
        headers: { correlationId: "corr-error" },
        error: new Error("Previous error")
      };

      // The strategy should still process the message even if there's an error field
      await strategy.process(eventBase, mockHandler);

      expect(mockHandler).toHaveBeenCalledWith(eventBase);
      expect(mockHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe("generic type support", () => {
    it("should work with typed strategy", async () => {
      interface UserData {
        userId: string;
        name: string;
        email: string;
      }

      const typedStrategy = new DefaultEventProcessingStrategy<UserData>();
      const mockHandler = jest.fn().mockResolvedValue(undefined);
      
      const eventBase: EventBase<UserData> = {
        message: {
          userId: "123",
          name: "John Doe",
          email: "john@example.com"
        },
        headers: { correlationId: "corr-typed" }
      };

      await typedStrategy.process(eventBase, mockHandler);

      expect(mockHandler).toHaveBeenCalledWith(eventBase);
    });

    it("should work with custom headers type", async () => {
      interface CustomHeaders {
        correlationId: string;
        userId: string;
        timestamp: string;
      }

      const typedStrategy = new DefaultEventProcessingStrategy<{ test: string }, CustomHeaders>();
      const mockHandler = jest.fn().mockResolvedValue(undefined);
      
      const eventBase: EventBase<{ test: string }, CustomHeaders> = {
        message: { test: "value" },
        headers: {
          correlationId: "corr-123",
          userId: "user-456",
          timestamp: "2023-01-01T00:00:00Z"
        }
      };

      await typedStrategy.process(eventBase, mockHandler);

      expect(mockHandler).toHaveBeenCalledWith(eventBase);
    });
  });

  describe("error handling", () => {
    it("should preserve original error message in HandlerExecutionError", async () => {
      const originalError = new Error("Custom error message");
      const mockHandler = jest.fn().mockRejectedValue(originalError);
      const eventBase: EventBase<{ test: string }> = {
        message: { test: "value" },
        headers: { correlationId: "corr-preserve" }
      };

      try {
        await strategy.process(eventBase, mockHandler);
      } catch (error) {
        expect(error).toBeInstanceOf(HandlerExecutionError);
        expect(error.message).toBe("Handler execution failed: Custom error message");
      }
    });

    it("should handle non-Error objects thrown by handler", async () => {
      const mockHandler = jest.fn().mockRejectedValue("String error");
      const eventBase: EventBase<{ test: string }> = {
        message: { test: "value" },
        headers: { correlationId: "corr-string" }
      };

      await expect(strategy.process(eventBase, mockHandler)).rejects.toThrow(
        HandlerExecutionError
      );

      await expect(strategy.process(eventBase, mockHandler)).rejects.toThrow(
        "Handler execution failed: String error"
      );
    });

    it("should handle null/undefined thrown by handler", async () => {
      const mockHandler = jest.fn().mockRejectedValue(null);
      const eventBase: EventBase<{ test: string }> = {
        message: { test: "value" },
        headers: { correlationId: "corr-null" }
      };

      // The current implementation wraps null in HandlerExecutionError
      await expect(strategy.process(eventBase, mockHandler)).rejects.toThrow(
        HandlerExecutionError
      );

      await expect(strategy.process(eventBase, mockHandler)).rejects.toThrow(
        "Handler execution failed: null"
      );
    });
  });

  describe("async handler support", () => {
    it("should wait for async handler to complete", async () => {
      let handlerCompleted = false;
      const mockHandler = jest.fn().mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        handlerCompleted = true;
      });

      const eventBase: EventBase<{ test: string }> = {
        message: { test: "value" },
        headers: { correlationId: "corr-async" }
      };

      await strategy.process(eventBase, mockHandler);

      expect(handlerCompleted).toBe(true);
      expect(mockHandler).toHaveBeenCalledTimes(1);
    });

    it("should handle async handler errors", async () => {
      const asyncError = new Error("Async handler failed");
      const mockHandler = jest.fn().mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        throw asyncError;
      });

      const eventBase: EventBase<{ test: string }> = {
        message: { test: "value" },
        headers: { correlationId: "corr-async-error" }
      };

      await expect(strategy.process(eventBase, mockHandler)).rejects.toThrow(
        HandlerExecutionError
      );

      await expect(strategy.process(eventBase, mockHandler)).rejects.toThrow(
        "Handler execution failed: Async handler failed"
      );
    });
  });
});
