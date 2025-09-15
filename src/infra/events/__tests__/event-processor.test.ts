import { EventProcessor } from "../event-processor";
import { EventBus } from "../event-bus";
import { EventBase } from "../event-base";
import { EventProcessorOptions } from "../types";
import { DefaultEventProcessingStrategy } from "../defaults";
import { EventValidationError, EventParsingError } from "../errors";

// Mock EventBus
class MockEventBus implements EventBus<unknown, Record<string, unknown>, string> {
  public subscriptions: Array<{ event: string; handler: (data: EventBase<unknown, Record<string, unknown>>) => void }> = [];
  public publishedEvents: Array<{ event: string; eventData: EventBase<unknown, Record<string, unknown>> }> = [];

  async connect(): Promise<void> {}
  async disconnect(): Promise<void> {}
  async checkHealth(): Promise<boolean> { return true; }
  async publish(event: string, eventData: EventBase<unknown, Record<string, unknown>>): Promise<void> {
    this.publishedEvents.push({ event, eventData });
  }
  async subscribe(event: string, handler: (data: EventBase<unknown, Record<string, unknown>>) => void): Promise<void> {
    this.subscriptions.push({ event, handler });
  }
  async unsubscribe(): Promise<void> {}
}

describe("EventProcessor", () => {
  let mockEventBus: MockEventBus;
  let eventProcessor: EventProcessor;

  beforeEach(() => {
    mockEventBus = new MockEventBus();
    eventProcessor = new EventProcessor(mockEventBus, {});
  });

  describe("constructor", () => {
    it("should create EventProcessor with default options", () => {
      const processor = new EventProcessor(mockEventBus, {});
      
      expect(processor).toBeInstanceOf(EventProcessor);
    });

    it("should create EventProcessor with custom options", () => {
      const customOptions: EventProcessorOptions<{ test: string }> = {
        maxParallelism: 5,
        retries: 3,
        dlq: {
          enabled: true,
          topic: "dlq-topic"
        },
        callbacks: {
          onError: jest.fn(),
          onSuccess: jest.fn(),
          onClose: jest.fn()
        }
      };

      const processor = new EventProcessor(mockEventBus, customOptions);
      
      expect(processor).toBeInstanceOf(EventProcessor);
    });
  });

  describe("addHandler", () => {
    it("should add handler for event type", async () => {
      const mockHandler = jest.fn().mockResolvedValue(undefined);
      const testEvent = "user.created";

      await eventProcessor.addHandler(testEvent, mockHandler);

      expect(eventProcessor.hasHandler(testEvent)).toBe(true);
      expect(eventProcessor.getRegisteredEvents()).toContain(testEvent);
    });

    it("should add multiple handlers for different events", async () => {
      const userHandler = jest.fn().mockResolvedValue(undefined);
      const orderHandler = jest.fn().mockResolvedValue(undefined);

      await eventProcessor.addHandler("user.created", userHandler);
      await eventProcessor.addHandler("order.created", orderHandler);

      expect(eventProcessor.getRegisteredEvents()).toEqual(["user.created", "order.created"]);
      expect(eventProcessor.hasHandler("user.created")).toBe(true);
      expect(eventProcessor.hasHandler("order.created")).toBe(true);
    });
  });

  describe("start", () => {
    it("should subscribe to all registered events", async () => {
      const userHandler = jest.fn().mockResolvedValue(undefined);
      const orderHandler = jest.fn().mockResolvedValue(undefined);

      await eventProcessor.addHandler("user.created", userHandler);
      await eventProcessor.addHandler("order.created", orderHandler);
      await eventProcessor.start();

      expect(mockEventBus.subscriptions).toHaveLength(2);
      expect(mockEventBus.subscriptions.map(s => s.event)).toEqual(["user.created", "order.created"]);
    });

    it("should process incoming events with correct routing", async () => {
      const userHandler = jest.fn().mockResolvedValue(undefined);
      const orderHandler = jest.fn().mockResolvedValue(undefined);

      await eventProcessor.addHandler("user.created", userHandler);
      await eventProcessor.addHandler("order.created", orderHandler);
      await eventProcessor.start();

      // Simulate incoming events
      const userEvent: EventBase<{ userId: string; name: string }> = {
        message: { userId: "123", name: "John Doe" },
        headers: { correlationId: "user-corr-123" }
      };

      const orderEvent: EventBase<{ orderId: string; amount: number }> = {
        message: { orderId: "order-456", amount: 99.99 },
        headers: { correlationId: "order-corr-456" }
      };

      // Find the correct subscription handlers
      const userSubscription = mockEventBus.subscriptions.find(s => s.event === "user.created");
      const orderSubscription = mockEventBus.subscriptions.find(s => s.event === "order.created");

      await userSubscription!.handler(userEvent);
      await orderSubscription!.handler(orderEvent);

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(userHandler).toHaveBeenCalledWith(userEvent);
      expect(orderHandler).toHaveBeenCalledWith(orderEvent);
    });

    it("should prevent starting twice", async () => {
      await eventProcessor.addHandler("user.created", jest.fn());
      await eventProcessor.start();

      await expect(eventProcessor.start()).rejects.toThrow(
        "EventProcessor is already started"
      );
    });

    it("should support dynamic handler registration after start", async () => {
      const initialHandler = jest.fn().mockResolvedValue(undefined);
      const additionalHandler = jest.fn().mockResolvedValue(undefined);

      await eventProcessor.addHandler("user.created", initialHandler);
      await eventProcessor.start();

      expect(mockEventBus.subscriptions).toHaveLength(1);

      // Add handler after start
      await eventProcessor.addHandler("order.created", additionalHandler);

      expect(mockEventBus.subscriptions).toHaveLength(2);
      expect(eventProcessor.getRegisteredEvents()).toEqual(["user.created", "order.created"]);
    });
  });

  describe("removeHandler", () => {
    it("should remove handler for event type", async () => {
      const userHandler = jest.fn().mockResolvedValue(undefined);
      const orderHandler = jest.fn().mockResolvedValue(undefined);

      await eventProcessor.addHandler("user.created", userHandler);
      await eventProcessor.addHandler("order.created", orderHandler);

      expect(eventProcessor.getRegisteredEvents()).toHaveLength(2);

      await eventProcessor.removeHandler("user.created");

      expect(eventProcessor.getRegisteredEvents()).toEqual(["order.created"]);
      expect(eventProcessor.hasHandler("user.created")).toBe(false);
      expect(eventProcessor.hasHandler("order.created")).toBe(true);
    });
  });

  describe("parallelism", () => {
    it("should process events in parallel with maxParallelism>1", async () => {
      const mockHandler = jest.fn().mockImplementation(async (event: EventBase<{ id: number }>) => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return event;
      });

      const processor = new EventProcessor(mockEventBus, { maxParallelism: 2 });
      await processor.addHandler("test.event", mockHandler);
      await processor.start();

      const event1: EventBase<{ id: number }> = {
        message: { id: 1 },
        headers: { correlationId: "corr-1" }
      };

      const event2: EventBase<{ id: number }> = {
        message: { id: 2 },
        headers: { correlationId: "corr-2" }
      };

      const subscription = mockEventBus.subscriptions[0];
      
      const startTime = Date.now();
      const promise1 = subscription.handler(event1);
      const promise2 = subscription.handler(event2);
      
      await Promise.all([promise1, promise2]);
      const endTime = Date.now();

      // Should process in parallel, so total time should be close to 50ms, not 100ms
      expect(endTime - startTime).toBeLessThan(80);
      expect(mockHandler).toHaveBeenCalledTimes(2);
    });

    it("should respect maxParallelism limit", async () => {
      const mockHandler = jest.fn().mockImplementation(async (event: EventBase<{ id: number }>) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return event;
      });

      const processor = new EventProcessor(mockEventBus, { maxParallelism: 2 });
      await processor.addHandler("test.event", mockHandler);
      await processor.start();

      const events = Array.from({ length: 5 }, (_, i) => ({
        message: { id: i },
        headers: { correlationId: `corr-${i}` }
      }));

      const subscription = mockEventBus.subscriptions[0];
      
      // Start all events
      const promises = events.map(event => subscription.handler(event));
      
      // Wait a bit to see how many are processing
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Should have at most 2 active handlers initially
      expect(mockHandler).toHaveBeenCalledTimes(2);
      
      // Wait for all to complete
      await Promise.all(promises);
      
      // Wait a bit more for all processing to complete
      await new Promise(resolve => setTimeout(resolve, 200));
      
      expect(mockHandler).toHaveBeenCalledTimes(5);
    });
  });

  describe("callbacks", () => {
    it("should call onSuccess callback when processing succeeds", async () => {
      const onSuccessCallback = jest.fn();
      const processor = new EventProcessor(mockEventBus, {
        callbacks: { onSuccess: onSuccessCallback }
      });

      const mockHandler = jest.fn().mockResolvedValue(undefined);
      await processor.addHandler("test.event", mockHandler);
      await processor.start();

      const event: EventBase<{ test: string }> = {
        message: { test: "value" },
        headers: { correlationId: "corr-success" }
      };

      const subscription = mockEventBus.subscriptions[0];
      await subscription.handler(event);

      // Wait a bit for async processing
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(onSuccessCallback).toHaveBeenCalledWith(event);
    });

    it("should call onError callback when handler fails", async () => {
      const onErrorCallback = jest.fn();
      const processor = new EventProcessor(mockEventBus, {
        retries: 0, // Disable retries for this test
        callbacks: { onError: onErrorCallback }
      });

      const handlerError = new Error("Handler failed");
      const mockHandler = jest.fn().mockRejectedValue(handlerError);
      await processor.addHandler("test.event", mockHandler);
      await processor.start();

      const event: EventBase<{ test: string }> = {
        message: { test: "value" },
        headers: { correlationId: "corr-error" }
      };

      const subscription = mockEventBus.subscriptions[0];
      await subscription.handler(event);

      // Wait a bit for async processing
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // The EventProcessor wraps the original error in HandlerExecutionError
      expect(onErrorCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Handler execution failed: Handler failed"
        }),
        event
      );
    });
  });

  describe("DLQ", () => {
    it("should send failed events to DLQ when enabled", async () => {
      const processor = new EventProcessor(mockEventBus, {
        retries: 0, // Disable retries for this test
        dlq: {
          enabled: true,
          topic: "dlq-topic"
        }
      });

      const mockHandler = jest.fn().mockRejectedValue(new Error("Handler failed"));
      await processor.addHandler("test.event", mockHandler);
      await processor.start();

      const event: EventBase<{ test: string }> = {
        message: { test: "value" },
        headers: { correlationId: "corr-dlq" }
      };

      const subscription = mockEventBus.subscriptions[0];
      await subscription.handler(event);

      // Wait a bit for async processing
      await new Promise(resolve => setTimeout(resolve, 10));

      // Check if event was published to DLQ
      expect(mockEventBus.publishedEvents).toHaveLength(1);
      expect(mockEventBus.publishedEvents[0].event).toBe("dlq-topic");
      expect(mockEventBus.publishedEvents[0].eventData.message).toEqual({ test: "value" });
      expect(mockEventBus.publishedEvents[0].eventData.error).toBeInstanceOf(Error);
    });

    it("should not send to DLQ when disabled", async () => {
      const processor = new EventProcessor(mockEventBus, {
        dlq: {
          enabled: false,
          topic: "dlq-topic"
        }
      });

      const mockHandler = jest.fn().mockRejectedValue(new Error("Handler failed"));
      await processor.addHandler("test.event", mockHandler);
      await processor.start();

      const event: EventBase<{ test: string }> = {
        message: { test: "value" },
        headers: { correlationId: "corr-no-dlq" }
      };

      const subscription = mockEventBus.subscriptions[0];
      await subscription.handler(event);

      expect(mockEventBus.publishedEvents).toHaveLength(0);
    });
  });

  describe("error handling", () => {
    it("should handle EventValidationError without retry", async () => {
      const processor = new EventProcessor(mockEventBus, {});
      const mockHandler = jest.fn().mockRejectedValue(new EventValidationError("Validation failed"));
      
      await processor.addHandler("test.event", mockHandler);
      await processor.start();

      const event: EventBase<{ test: string }> = {
        message: { test: "value" },
        headers: { correlationId: "corr-validation" }
      };

      const subscription = mockEventBus.subscriptions[0];
      await subscription.handler(event);

      // Should not retry validation errors
      expect(mockHandler).toHaveBeenCalledTimes(1);
    });

    it("should handle EventParsingError without retry", async () => {
      const processor = new EventProcessor(mockEventBus, {});
      const mockHandler = jest.fn().mockRejectedValue(new EventParsingError("Parsing failed"));
      
      await processor.addHandler("test.event", mockHandler);
      await processor.start();

      const event: EventBase<{ test: string }> = {
        message: { test: "value" },
        headers: { correlationId: "corr-parsing" }
      };

      const subscription = mockEventBus.subscriptions[0];
      await subscription.handler(event);

      // Should not retry parsing errors
      expect(mockHandler).toHaveBeenCalledTimes(1);
    });

    it("should handle unknown events gracefully", async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      await eventProcessor.addHandler("user.created", jest.fn());
      await eventProcessor.start();

      // Manually add to queue to simulate unknown event
      const unknownEvent: EventBase<{ test: string }> = {
        message: { test: "value" },
        headers: { correlationId: "unknown" }
      };

      (eventProcessor as any).processingQueue.push({
        event: "unknown.event",
        eventData: unknownEvent
      });

      // Process the queue
      await (eventProcessor as any).processNext(
        new DefaultEventProcessingStrategy(),
        1
      );

      expect(consoleSpy).toHaveBeenCalledWith("No handler found for event: unknown.event");
      
      consoleSpy.mockRestore();
    });
  });

  describe("shutdown", () => {
    it("should shutdown gracefully", async () => {
      const onCloseCallback = jest.fn();
      const processor = new EventProcessor(mockEventBus, {
        callbacks: { onClose: onCloseCallback }
      });

      await processor.addHandler("test.event", jest.fn());
      await processor.start();
      await processor.shutdown();

      expect(onCloseCallback).toHaveBeenCalled();
    });

    it("should wait for active handlers to complete", async () => {
      let handlerCompleted = false;
      const mockHandler = jest.fn().mockImplementation(async (event: EventBase<{ test: string }>) => {
        await new Promise(resolve => setTimeout(resolve, 50));
        handlerCompleted = true;
      });

      const processor = new EventProcessor(mockEventBus, {});
      await processor.addHandler("test.event", mockHandler);
      await processor.start();

      const event: EventBase<{ test: string }> = {
        message: { test: "value" },
        headers: { correlationId: "corr-shutdown" }
      };

      const subscription = mockEventBus.subscriptions[0];
      
      // Start processing
      const processPromise = subscription.handler(event);
      
      // Shutdown while processing
      const shutdownPromise = processor.shutdown();
      
      await Promise.all([processPromise, shutdownPromise]);

      expect(handlerCompleted).toBe(true);
    });

    it("should not process new events after shutdown", async () => {
      const mockHandler = jest.fn().mockResolvedValue(undefined);
      const processor = new EventProcessor(mockEventBus, {});
      
      await processor.addHandler("test.event", mockHandler);
      await processor.start();
      await processor.shutdown();

      const event: EventBase<{ test: string }> = {
        message: { test: "value" },
        headers: { correlationId: "corr-after-shutdown" }
      };

      const subscription = mockEventBus.subscriptions[0];
      await subscription.handler(event);

      // Wait a bit for processing
      await new Promise(resolve => setTimeout(resolve, 10));

      // Handler should not be called after shutdown because isStarted flag prevents processing
      expect(mockHandler).not.toHaveBeenCalled();
    });
  });
});












