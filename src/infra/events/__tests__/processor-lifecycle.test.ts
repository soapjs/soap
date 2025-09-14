import { EventProcessor } from "../event-processor";
import { EventBus } from "../event-bus";
import { EventBase } from "../event-base";

// Mock EventBus for testing
class MockEventBus implements EventBus<unknown, Record<string, unknown>, string> {
  public subscriptions: Array<{ event: string; handler: (data: EventBase<unknown, Record<string, unknown>>) => void }> = [];
  public publishedEvents: Array<{ event: string; eventData: EventBase<unknown, Record<string, unknown>> }> = [];
  public disconnectCalled = false;

  async connect(): Promise<void> {}
  async disconnect(): Promise<void> {
    this.disconnectCalled = true;
  }
  async checkHealth(): Promise<boolean> { return true; }
  async publish(): Promise<void> {}
  async subscribe(event: string, handler: (data: EventBase<unknown, Record<string, unknown>>) => void): Promise<void> {
    this.subscriptions.push({ event, handler });
  }
  async unsubscribe(): Promise<void> {}
}

describe("EventProcessor Lifecycle Management", () => {
  let mockEventBus: MockEventBus;
  let eventProcessor: EventProcessor;

  beforeEach(() => {
    mockEventBus = new MockEventBus();
    eventProcessor = new EventProcessor(mockEventBus, {});
  });

  describe("shutdown and restart", () => {
    it("should allow restart after shutdown", async () => {
      const mockHandler = jest.fn().mockResolvedValue(undefined);
      
      await eventProcessor.addHandler("test.event", mockHandler);
      await eventProcessor.start();
      
      expect(eventProcessor.getRegisteredEvents()).toHaveLength(1);
      expect(mockEventBus.subscriptions).toHaveLength(1);
      
      // Shutdown
      await eventProcessor.shutdown();
      expect(mockEventBus.disconnectCalled).toBe(true);
      
      // Should be able to start again
      await eventProcessor.start();
      expect(eventProcessor.getRegisteredEvents()).toHaveLength(1);
      expect(mockEventBus.subscriptions).toHaveLength(2); // New subscription after restart
    });

    it("should reset isStarted flag after shutdown", async () => {
      await eventProcessor.addHandler("test.event", jest.fn());
      await eventProcessor.start();
      
      // Verify it's started
      expect((eventProcessor as any).isStarted).toBe(true);
      
      await eventProcessor.shutdown();
      
      // Verify it's reset
      expect((eventProcessor as any).isStarted).toBe(false);
      expect((eventProcessor as any).isShuttingDown).toBe(false);
    });

    it("should prevent starting twice", async () => {
      await eventProcessor.addHandler("test.event", jest.fn());
      await eventProcessor.start();
      
      await expect(eventProcessor.start()).rejects.toThrow(
        "EventProcessor is already started"
      );
    });
  });

  describe("reset method", () => {
    it("should reset processor state when not started", async () => {
      // Add some handlers but don't start
      await eventProcessor.addHandler("test.event", jest.fn());
      
      // Manually add items to queue to test reset
      (eventProcessor as any).processingQueue = [
        { event: "test.event", eventData: { message: "test" }, retryCount: 0 }
      ];
      (eventProcessor as any).activeHandlers = 2;
      
      await eventProcessor.reset();
      
      expect((eventProcessor as any).processingQueue).toHaveLength(0);
      expect((eventProcessor as any).activeHandlers).toBe(0);
      expect((eventProcessor as any).isShuttingDown).toBe(false);
    });

    it("should throw error when trying to reset while started", async () => {
      await eventProcessor.addHandler("test.event", jest.fn());
      await eventProcessor.start();
      
      await expect(eventProcessor.reset()).rejects.toThrow(
        "Cannot reset while processor is running. Call shutdown() first."
      );
    });
  });

  describe("restart method", () => {
    it("should restart processor after shutdown", async () => {
      const mockHandler = jest.fn().mockResolvedValue(undefined);
      
      await eventProcessor.addHandler("test.event", mockHandler);
      await eventProcessor.start();
      
      // Verify initial state
      expect((eventProcessor as any).isStarted).toBe(true);
      expect(mockEventBus.subscriptions).toHaveLength(1);
      
      // Restart
      await eventProcessor.restart();
      
      // Verify restart state
      expect((eventProcessor as any).isStarted).toBe(true);
      expect(mockEventBus.subscriptions).toHaveLength(2); // New subscription after restart
      expect(eventProcessor.getRegisteredEvents()).toEqual(["test.event"]);
    });

    it("should restart processor even if not started", async () => {
      const mockHandler = jest.fn().mockResolvedValue(undefined);
      
      await eventProcessor.addHandler("test.event", mockHandler);
      // Don't start initially
      
      // Restart should work
      await eventProcessor.restart();
      
      expect((eventProcessor as any).isStarted).toBe(true);
      expect(mockEventBus.subscriptions).toHaveLength(1);
    });

    it("should process events after restart", async () => {
      const mockHandler = jest.fn().mockResolvedValue(undefined);
      
      await eventProcessor.addHandler("test.event", mockHandler);
      await eventProcessor.start();
      
      // Restart
      await eventProcessor.restart();
      
      // Process an event
      const event: EventBase<{ test: string }> = {
        message: { test: "value" },
        headers: { correlationId: "corr-restart" }
      };

      const subscription = mockEventBus.subscriptions[1]; // Get the new subscription
      await subscription.handler(event);

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockHandler).toHaveBeenCalledWith(event);
    });
  });

  describe("error callback behavior", () => {
    it("should call onError callback for every error, not just after max retries", async () => {
      const onErrorCallback = jest.fn();
      const onRetryCallback = jest.fn();
      
      const processor = new EventProcessor(mockEventBus, {
        retries: 2,
        retryDelay: 50,
        backoff: { type: "fixed", jitter: false },
        callbacks: { 
          onError: onErrorCallback,
          onRetry: onRetryCallback
        }
      });

      const mockHandler = jest.fn().mockRejectedValue(new Error("Test error"));
      await processor.addHandler("test.event", mockHandler);
      await processor.start();

      const event: EventBase<{ test: string }> = {
        message: { test: "value" },
        headers: { correlationId: "corr-error-callback" }
      };

      const subscription = mockEventBus.subscriptions[0];
      await subscription.handler(event);

      // Wait for all retries to complete
      await new Promise(resolve => setTimeout(resolve, 300));

      // onError should be called for every error (initial + 2 retries = 3 times)
      expect(onErrorCallback).toHaveBeenCalledTimes(3);
      
      // onRetry should be called for each retry attempt (2 times)
      expect(onRetryCallback).toHaveBeenCalledTimes(2);
      
      // All calls should have the same error and event
      expect(onErrorCallback).toHaveBeenNthCalledWith(1, expect.any(Error), event);
      expect(onErrorCallback).toHaveBeenNthCalledWith(2, expect.any(Error), event);
      expect(onErrorCallback).toHaveBeenNthCalledWith(3, expect.any(Error), event);
    });

    it("should call onError callback immediately for non-retriable errors", async () => {
      const onErrorCallback = jest.fn();
      
      const processor = new EventProcessor(mockEventBus, {
        retries: 3,
        callbacks: { onError: onErrorCallback }
      });

      const mockHandler = jest.fn().mockRejectedValue(new Error("Validation failed"));
      await processor.addHandler("test.event", mockHandler);
      await processor.start();

      const event: EventBase<{ test: string }> = {
        message: { test: "value" },
        headers: { correlationId: "corr-non-retriable" }
      };

      const subscription = mockEventBus.subscriptions[0];
      await subscription.handler(event);

      // Wait a bit for processing
      await new Promise(resolve => setTimeout(resolve, 50));

      // onError should be called only once for non-retriable errors
      expect(onErrorCallback).toHaveBeenCalledTimes(1);
      expect(onErrorCallback).toHaveBeenCalledWith(expect.any(Error), event);
    });
  });

  describe("state management", () => {
    it("should maintain correct state during lifecycle", async () => {
      const mockHandler = jest.fn().mockResolvedValue(undefined);
      
      // Initial state
      expect((eventProcessor as any).isStarted).toBe(false);
      expect((eventProcessor as any).isShuttingDown).toBe(false);
      
      // Add handler
      await eventProcessor.addHandler("test.event", mockHandler);
      expect(eventProcessor.getRegisteredEvents()).toEqual(["test.event"]);
      
      // Start
      await eventProcessor.start();
      expect((eventProcessor as any).isStarted).toBe(true);
      expect((eventProcessor as any).isShuttingDown).toBe(false);
      
      // Shutdown
      await eventProcessor.shutdown();
      expect((eventProcessor as any).isStarted).toBe(false);
      expect((eventProcessor as any).isShuttingDown).toBe(false);
      
      // Handlers should still be registered
      expect(eventProcessor.getRegisteredEvents()).toEqual(["test.event"]);
    });

    it("should clear processing queue on reset", async () => {
      // Manually add items to queue
      (eventProcessor as any).processingQueue = [
        { event: "test.event", eventData: { message: "test1" }, retryCount: 0 },
        { event: "test.event", eventData: { message: "test2" }, retryCount: 1 }
      ];
      (eventProcessor as any).activeHandlers = 1;
      
      await eventProcessor.reset();
      
      expect((eventProcessor as any).processingQueue).toHaveLength(0);
      expect((eventProcessor as any).activeHandlers).toBe(0);
    });
  });
});

