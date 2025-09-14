import { EventDispatcher, EventDispatcherOptions } from "../event-dispatcher";
import { EventBus } from "../event-bus";
import { ExternalEvent } from "../external-event";
import { EventBase } from "../event-base";

// Mock EventBus
class MockEventBus implements EventBus<unknown, Record<string, unknown>, string> {
  public publishedEvents: Array<{ event: string; eventData: EventBase<unknown, Record<string, unknown>> }> = [];
  public shouldThrowError = false;
  public errorMessage = "Mock error";

  async connect(): Promise<void> {
    // Mock implementation
  }

  async disconnect(): Promise<void> {
    // Mock implementation
  }

  async checkHealth(): Promise<boolean> {
    return true;
  }

  async publish(
    event: string,
    eventData: EventBase<unknown, Record<string, unknown>>
  ): Promise<void> {
    if (this.shouldThrowError) {
      throw new Error(this.errorMessage);
    }
    this.publishedEvents.push({ event, eventData });
  }

  async subscribe(): Promise<void> {
    // Mock implementation
  }

  async unsubscribe(): Promise<void> {
    // Mock implementation
  }
}

describe("EventDispatcher", () => {
  let mockEventBus: MockEventBus;
  let eventDispatcher: EventDispatcher;

  beforeEach(() => {
    mockEventBus = new MockEventBus();
    eventDispatcher = new EventDispatcher(mockEventBus);
  });

  describe("constructor", () => {
    it("should create EventDispatcher with default options", () => {
      const dispatcher = new EventDispatcher(mockEventBus);
      const options = dispatcher.getOptions();

      expect(options.maxRetries).toBe(3);
      expect(options.retryDelay).toBe(1000);
      expect(options.exponentialBackoff).toBe(false);
      expect(options.callbacks).toEqual({});
      expect(typeof options.correlationIdGenerator).toBe("function");
      expect(typeof options.timestampGenerator).toBe("function");
    });

    it("should create EventDispatcher with custom options", () => {
      const customOptions: EventDispatcherOptions = {
        maxRetries: 5,
        retryDelay: 2000,
        exponentialBackoff: true,
        callbacks: {
          onSuccess: jest.fn(),
          onError: jest.fn(),
          onRetry: jest.fn()
        },
        correlationIdGenerator: () => "custom-correlation-id",
        timestampGenerator: () => "2023-01-01T00:00:00Z"
      };

      const dispatcher = new EventDispatcher(mockEventBus, customOptions);
      const options = dispatcher.getOptions();

      expect(options.maxRetries).toBe(5);
      expect(options.retryDelay).toBe(2000);
      expect(options.exponentialBackoff).toBe(true);
      expect(options.callbacks).toEqual(customOptions.callbacks);
      expect(options.correlationIdGenerator()).toBe("custom-correlation-id");
      expect(options.timestampGenerator()).toBe("2023-01-01T00:00:00Z");
    });
  });

  describe("dispatch", () => {
    const createExternalEvent = (overrides: Partial<ExternalEvent> = {}): ExternalEvent => ({
      type: "user.created",
      timestamp: new Date("2023-01-01T00:00:00Z"),
      data: { userId: "123", name: "John Doe" },
      correlationId: "corr-123",
      source: "user-service",
      ...overrides
    });

    it("should dispatch external event successfully", async () => {
      const externalEvent = createExternalEvent();

      await eventDispatcher.dispatch(externalEvent);

      expect(mockEventBus.publishedEvents).toHaveLength(1);
      const publishedEvent = mockEventBus.publishedEvents[0];
      expect(publishedEvent.event).toBe("user.created");
      expect(publishedEvent.eventData.message).toEqual(externalEvent.data);
      expect(publishedEvent.eventData.headers).toMatchObject({
        eventId: externalEvent.id,
        eventType: "user.created",
        correlationId: "corr-123",
        causationId: externalEvent.causationId,
        source: "user-service",
        destination: externalEvent.destination,
        timestamp: "2023-01-01T00:00:00.000Z"
      });
    });

    it("should dispatch external event with all optional fields", async () => {
      const externalEvent = createExternalEvent({
        id: "evt-456",
        causationId: "evt-123",
        destination: "notification-service",
        metadata: {
          version: "1.0",
          priority: "high"
        }
      });

      await eventDispatcher.dispatch(externalEvent);

      expect(mockEventBus.publishedEvents).toHaveLength(1);
      const publishedEvent = mockEventBus.publishedEvents[0];
      expect(publishedEvent.eventData.headers).toMatchObject({
        eventId: "evt-456",
        eventType: "user.created",
        correlationId: "corr-123",
        causationId: "evt-123",
        source: "user-service",
        destination: "notification-service",
        timestamp: "2023-01-01T00:00:00.000Z",
        version: "1.0",
        priority: "high"
      });
    });

    it("should call onSuccess callback when dispatch succeeds", async () => {
      const onSuccessCallback = jest.fn();
      const dispatcher = new EventDispatcher(mockEventBus, {
        callbacks: { onSuccess: onSuccessCallback }
      });

      const externalEvent = createExternalEvent();
      await dispatcher.dispatch(externalEvent);

      expect(onSuccessCallback).toHaveBeenCalledWith(externalEvent);
    });

    it("should retry on failure and eventually succeed", async () => {
      mockEventBus.shouldThrowError = true;
      mockEventBus.errorMessage = "Network error";

      const onRetryCallback = jest.fn();
      const onErrorCallback = jest.fn();
      const dispatcher = new EventDispatcher(mockEventBus, {
        maxRetries: 2,
        retryDelay: 10, // Short delay for testing
        callbacks: {
          onRetry: onRetryCallback,
          onError: onErrorCallback
        }
      });

      const externalEvent = createExternalEvent();

      await expect(dispatcher.dispatch(externalEvent)).rejects.toThrow(
        "Failed to dispatch event 'user.created' after 2 attempts: Network error"
      );

      expect(onRetryCallback).toHaveBeenCalledTimes(1);
      expect(onRetryCallback).toHaveBeenCalledWith("user.created", 1, expect.any(Error));
      expect(onErrorCallback).toHaveBeenCalledTimes(1);
      expect(onErrorCallback).toHaveBeenCalledWith(expect.any(Error), externalEvent);
    });

    it("should succeed on retry", async () => {
      let attemptCount = 0;
      const originalPublish = mockEventBus.publish.bind(mockEventBus);
      mockEventBus.publish = jest.fn().mockImplementation(async (event, eventData) => {
        attemptCount++;
        if (attemptCount === 1) {
          throw new Error("Temporary error");
        }
        return originalPublish(event, eventData);
      });

      const onSuccessCallback = jest.fn();
      const onRetryCallback = jest.fn();
      const dispatcher = new EventDispatcher(mockEventBus, {
        maxRetries: 3,
        retryDelay: 10,
        callbacks: {
          onSuccess: onSuccessCallback,
          onRetry: onRetryCallback
        }
      });

      const externalEvent = createExternalEvent();
      await dispatcher.dispatch(externalEvent);

      expect(attemptCount).toBe(2);
      expect(onRetryCallback).toHaveBeenCalledTimes(1);
      expect(onSuccessCallback).toHaveBeenCalledWith(externalEvent);
      expect(mockEventBus.publishedEvents).toHaveLength(1);
    });

    it("should use exponential backoff when enabled", async () => {
      mockEventBus.shouldThrowError = true;
      const dispatcher = new EventDispatcher(mockEventBus, {
        maxRetries: 3,
        retryDelay: 100,
        exponentialBackoff: true
      });

      const externalEvent = createExternalEvent();
      const startTime = Date.now();

      await expect(dispatcher.dispatch(externalEvent)).rejects.toThrow();

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // With exponential backoff: 100ms + 200ms = 300ms minimum
      expect(totalTime).toBeGreaterThanOrEqual(300);
    });

    it("should validate external event", async () => {
      const invalidEvent = createExternalEvent({ type: "" });

      await expect(eventDispatcher.dispatch(invalidEvent)).rejects.toThrow(
        "Event type is required"
      );
    });

    it("should validate correlation ID", async () => {
      const invalidEvent = createExternalEvent({ correlationId: "" });

      await expect(eventDispatcher.dispatch(invalidEvent)).rejects.toThrow(
        "Correlation ID is required"
      );
    });

    it("should validate source", async () => {
      const invalidEvent = createExternalEvent({ source: "" });

      await expect(eventDispatcher.dispatch(invalidEvent)).rejects.toThrow(
        "Event source is required"
      );
    });

    it("should validate external event existence", async () => {
      await expect(eventDispatcher.dispatch(null as any)).rejects.toThrow(
        "External event is required"
      );
    });
  });

  describe("getOptions", () => {
    it("should return a copy of options", () => {
      const options1 = eventDispatcher.getOptions();
      const options2 = eventDispatcher.getOptions();

      expect(options1).toEqual(options2);
      expect(options1).not.toBe(options2); // Should be different objects
    });
  });

  describe("correlation ID generation", () => {
    it("should generate unique correlation IDs", () => {
      const options = eventDispatcher.getOptions();
      const id1 = options.correlationIdGenerator();
      const id2 = options.correlationIdGenerator();

      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
    });

    it("should use custom correlation ID generator", () => {
      const customGenerator = jest.fn().mockReturnValue("custom-id");
      const dispatcher = new EventDispatcher(mockEventBus, {
        correlationIdGenerator: customGenerator
      });

      const options = dispatcher.getOptions();
      const id = options.correlationIdGenerator();

      expect(customGenerator).toHaveBeenCalled();
      expect(id).toBe("custom-id");
    });
  });

  describe("timestamp generation", () => {
    it("should generate valid timestamps", () => {
      const options = eventDispatcher.getOptions();
      const timestamp = options.timestampGenerator();

      expect(timestamp).toBeDefined();
      expect(new Date(timestamp)).toBeInstanceOf(Date);
      expect(new Date(timestamp).getTime()).not.toBeNaN();
    });

    it("should use custom timestamp generator", () => {
      const customGenerator = jest.fn().mockReturnValue("2023-01-01T00:00:00Z");
      const dispatcher = new EventDispatcher(mockEventBus, {
        timestampGenerator: customGenerator
      });

      const options = dispatcher.getOptions();
      const timestamp = options.timestampGenerator();

      expect(customGenerator).toHaveBeenCalled();
      expect(timestamp).toBe("2023-01-01T00:00:00Z");
    });
  });
});
