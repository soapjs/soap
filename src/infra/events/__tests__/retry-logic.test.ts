import { EventProcessor } from "../event-processor";
import { EventBus } from "../event-bus";
import { EventBase } from "../event-base";
import { EventValidationError, EventParsingError } from "../errors";

// Mock EventBus for testing
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

describe("EventProcessor Retry Logic", () => {
  let mockEventBus: MockEventBus;
  let eventProcessor: EventProcessor;

  beforeEach(() => {
    mockEventBus = new MockEventBus();
  });

  describe("retry with exponential backoff", () => {
    it("should retry failed handlers with exponential backoff", async () => {
      let attemptCount = 0;
      const mockHandler = jest.fn().mockImplementation(async (event: EventBase<{ test: string }>) => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error("Temporary failure");
        }
        // Succeed on 3rd attempt
      });

      const processor = new EventProcessor(mockEventBus, {
        retries: 3,
        retryDelay: 100,
        backoff: { type: "exponential", multiplier: 2, jitter: false }
      });

      await processor.addHandler("test.event", mockHandler);
      await processor.start();

      const event: EventBase<{ test: string }> = {
        message: { test: "value" },
        headers: { correlationId: "corr-retry" }
      };

      const subscription = mockEventBus.subscriptions[0];
      await subscription.handler(event);

      // Wait for all retries to complete
      await new Promise(resolve => setTimeout(resolve, 1000));

      expect(mockHandler).toHaveBeenCalledTimes(3);
      expect(mockEventBus.publishedEvents).toHaveLength(0); // Should not go to DLQ
    });

    it("should send to DLQ after max retries exceeded", async () => {
      const mockHandler = jest.fn().mockRejectedValue(new Error("Persistent failure"));

      const processor = new EventProcessor(mockEventBus, {
        retries: 2,
        retryDelay: 50,
        backoff: { type: "exponential", multiplier: 2, jitter: false },
        dlq: { enabled: true, topic: "dlq-topic" }
      });

      await processor.addHandler("test.event", mockHandler);
      await processor.start();

      const event: EventBase<{ test: string }> = {
        message: { test: "value" },
        headers: { correlationId: "corr-dlq" }
      };

      const subscription = mockEventBus.subscriptions[0];
      await subscription.handler(event);

      // Wait for all retries to complete
      await new Promise(resolve => setTimeout(resolve, 500));

      expect(mockHandler).toHaveBeenCalledTimes(3); // Initial + 2 retries
      expect(mockEventBus.publishedEvents).toHaveLength(1);
      expect(mockEventBus.publishedEvents[0].event).toBe("dlq-topic");
      expect(mockEventBus.publishedEvents[0].eventData.message).toEqual({ test: "value" });
      expect(mockEventBus.publishedEvents[0].eventData.error).toBeInstanceOf(Error);
    });

    it("should call onRetry callback for each retry attempt", async () => {
      const onRetryCallback = jest.fn();
      const onErrorCallback = jest.fn();
      const mockHandler = jest.fn().mockRejectedValue(new Error("Retry test"));

      const processor = new EventProcessor(mockEventBus, {
        retries: 2,
        retryDelay: 50,
        backoff: { type: "fixed", jitter: false },
        callbacks: { 
          onRetry: onRetryCallback,
          onError: onErrorCallback
        }
      });

      await processor.addHandler("test.event", mockHandler);
      await processor.start();

      const event: EventBase<{ test: string }> = {
        message: { test: "value" },
        headers: { correlationId: "corr-callback" }
      };

      const subscription = mockEventBus.subscriptions[0];
      await subscription.handler(event);

      // Wait for retries to complete
      await new Promise(resolve => setTimeout(resolve, 200));

      // onError should be called for every error (initial + 2 retries = 3 times)
      expect(onErrorCallback).toHaveBeenCalledTimes(3);
      
      // onRetry should be called for each retry attempt (2 times)
      expect(onRetryCallback).toHaveBeenCalledTimes(2);
      expect(onRetryCallback).toHaveBeenNthCalledWith(1, expect.any(Error), event, 1);
      expect(onRetryCallback).toHaveBeenNthCalledWith(2, expect.any(Error), event, 2);
    });
  });

  describe("retry with fixed backoff", () => {
    it("should retry with fixed delay", async () => {
      let attemptCount = 0;
      const mockHandler = jest.fn().mockImplementation(async (event: EventBase<{ test: string }>) => {
        attemptCount++;
        if (attemptCount < 2) {
          throw new Error("Temporary failure");
        }
      });

      const processor = new EventProcessor(mockEventBus, {
        retries: 2,
        retryDelay: 100,
        backoff: { type: "fixed", jitter: false }
      });

      await processor.addHandler("test.event", mockHandler);
      await processor.start();

      const event: EventBase<{ test: string }> = {
        message: { test: "value" },
        headers: { correlationId: "corr-fixed" }
      };

      const subscription = mockEventBus.subscriptions[0];
      await subscription.handler(event);

      // Wait for retries to complete
      await new Promise(resolve => setTimeout(resolve, 300));

      expect(mockHandler).toHaveBeenCalledTimes(2);
    });
  });

  describe("retry with jitter", () => {
    it("should add jitter to retry delays", async () => {
      const mockHandler = jest.fn().mockRejectedValue(new Error("Jitter test"));

      const processor = new EventProcessor(mockEventBus, {
        retries: 1,
        retryDelay: 100,
        backoff: { type: "fixed", jitter: true }
      });

      await processor.addHandler("test.event", mockHandler);
      await processor.start();

      const event: EventBase<{ test: string }> = {
        message: { test: "value" },
        headers: { correlationId: "corr-jitter" }
      };

      const subscription = mockEventBus.subscriptions[0];
      await subscription.handler(event);

      // Wait for retry to complete
      await new Promise(resolve => setTimeout(resolve, 200));

      expect(mockHandler).toHaveBeenCalledTimes(2);
    });
  });

  describe("retry with max delay limit", () => {
    it("should respect max delay limit", async () => {
      const mockHandler = jest.fn().mockRejectedValue(new Error("Max delay test"));

      const processor = new EventProcessor(mockEventBus, {
        retries: 3,
        retryDelay: 100,
        backoff: { type: "exponential", multiplier: 10, maxDelay: 200, jitter: false }
      });

      await processor.addHandler("test.event", mockHandler);
      await processor.start();

      const event: EventBase<{ test: string }> = {
        message: { test: "value" },
        headers: { correlationId: "corr-max-delay" }
      };

      const subscription = mockEventBus.subscriptions[0];
      await subscription.handler(event);

      // Wait for retries to complete
      await new Promise(resolve => setTimeout(resolve, 800));

      expect(mockHandler).toHaveBeenCalledTimes(4); // Initial + 3 retries
    });
  });

  describe("non-retriable errors", () => {
    it("should not retry EventValidationError", async () => {
      const mockHandler = jest.fn().mockRejectedValue(new EventValidationError("Validation failed"));

      const processor = new EventProcessor(mockEventBus, {
        retries: 3,
        retryDelay: 50
      });

      await processor.addHandler("test.event", mockHandler);
      await processor.start();

      const event: EventBase<{ test: string }> = {
        message: { test: "value" },
        headers: { correlationId: "corr-validation" }
      };

      const subscription = mockEventBus.subscriptions[0];
      await subscription.handler(event);

      // Wait a bit to ensure no retries happen
      await new Promise(resolve => setTimeout(resolve, 200));

      expect(mockHandler).toHaveBeenCalledTimes(1);
      expect(mockEventBus.publishedEvents).toHaveLength(0);
    });

    it("should not retry EventParsingError", async () => {
      const mockHandler = jest.fn().mockRejectedValue(new EventParsingError("Parsing failed"));

      const processor = new EventProcessor(mockEventBus, {
        retries: 3,
        retryDelay: 50
      });

      await processor.addHandler("test.event", mockHandler);
      await processor.start();

      const event: EventBase<{ test: string }> = {
        message: { test: "value" },
        headers: { correlationId: "corr-parsing" }
      };

      const subscription = mockEventBus.subscriptions[0];
      await subscription.handler(event);

      // Wait a bit to ensure no retries happen
      await new Promise(resolve => setTimeout(resolve, 200));

      expect(mockHandler).toHaveBeenCalledTimes(1);
      expect(mockEventBus.publishedEvents).toHaveLength(0);
    });
  });

  describe("default retry configuration", () => {
    it("should use default retry settings", async () => {
      const mockHandler = jest.fn().mockRejectedValue(new Error("Default test"));

      const processor = new EventProcessor(mockEventBus, {}); // No retry options specified

      await processor.addHandler("test.event", mockHandler);
      await processor.start();

      const event: EventBase<{ test: string }> = {
        message: { test: "value" },
        headers: { correlationId: "corr-default" }
      };

      const subscription = mockEventBus.subscriptions[0];
      await subscription.handler(event);

      // Wait for default retries to complete (3 retries with exponential backoff: 1000ms, 2000ms, 4000ms)
      await new Promise(resolve => setTimeout(resolve, 8000));

      expect(mockHandler).toHaveBeenCalledTimes(4); // Initial + 3 retries (default)
    });
  });

  describe("retry timing", () => {
    it("should respect retry delays", async () => {
      const startTime = Date.now();
      const mockHandler = jest.fn().mockRejectedValue(new Error("Timing test"));

      const processor = new EventProcessor(mockEventBus, {
        retries: 2,
        retryDelay: 100,
        backoff: { type: "fixed", jitter: false }
      });

      await processor.addHandler("test.event", mockHandler);
      await processor.start();

      const event: EventBase<{ test: string }> = {
        message: { test: "value" },
        headers: { correlationId: "corr-timing" }
      };

      const subscription = mockEventBus.subscriptions[0];
      await subscription.handler(event);

      // Wait for all retries to complete
      await new Promise(resolve => setTimeout(resolve, 400));

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Should take at least 200ms (2 retries * 100ms delay)
      expect(totalTime).toBeGreaterThanOrEqual(200);
      expect(mockHandler).toHaveBeenCalledTimes(3);
    });
  });
});












