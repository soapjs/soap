import { EventProcessor } from "../event-processor";
import { EventBus } from "../event-bus";
import { EventBase } from "../event-base";

// Mock EventBus for testing
class MockEventBus implements EventBus<unknown, Record<string, unknown>, string> {
  public subscriptions: Array<{ event: string; handler: (data: EventBase<unknown, Record<string, unknown>>) => void }> = [];

  async connect(): Promise<void> {}
  async disconnect(): Promise<void> {}
  async checkHealth(): Promise<boolean> { return true; }
  async publish(): Promise<void> {}
  
  async subscribe(
    event: string,
    handler: (data: EventBase<unknown, Record<string, unknown>>) => void
  ): Promise<void> {
    this.subscriptions.push({ event, handler });
  }

  async unsubscribe(): Promise<void> {}
}

describe("Multi-Handler EventProcessor Example", () => {
  let mockEventBus: MockEventBus;
  let eventProcessor: EventProcessor;

  beforeEach(() => {
    mockEventBus = new MockEventBus();
    eventProcessor = new EventProcessor(mockEventBus, {});
  });

  it("should demonstrate multi-handler usage pattern", async () => {
    // Define handlers for different event types
    const userHandler = jest.fn().mockResolvedValue(undefined);
    const orderHandler = jest.fn().mockResolvedValue(undefined);
    const paymentHandler = jest.fn().mockResolvedValue(undefined);

    // Register handlers for different event types
    await eventProcessor.addHandler("user.created", userHandler);
    await eventProcessor.addHandler("user.updated", userHandler);
    await eventProcessor.addHandler("order.created", orderHandler);
    await eventProcessor.addHandler("order.completed", orderHandler);
    await eventProcessor.addHandler("payment.processed", paymentHandler);

    // Start processing all registered events
    await eventProcessor.start();

    // Verify all events are subscribed
    expect(mockEventBus.subscriptions).toHaveLength(5);
    expect(mockEventBus.subscriptions.map(s => s.event)).toEqual([
      "user.created",
      "user.updated", 
      "order.created",
      "order.completed",
      "payment.processed"
    ]);

    // Verify registered events
    expect(eventProcessor.getRegisteredEvents()).toEqual([
      "user.created",
      "user.updated",
      "order.created", 
      "order.completed",
      "payment.processed"
    ]);

    // Verify handlers exist
    expect(eventProcessor.hasHandler("user.created")).toBe(true);
    expect(eventProcessor.hasHandler("order.created")).toBe(true);
    expect(eventProcessor.hasHandler("payment.processed")).toBe(true);
    expect(eventProcessor.hasHandler("nonexistent.event")).toBe(false);
  });

  it("should handle events with correct routing", async () => {
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

    expect(userSubscription).toBeDefined();
    expect(orderSubscription).toBeDefined();

    // Process events
    await userSubscription!.handler(userEvent);
    await orderSubscription!.handler(orderEvent);

    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 10));

    // Verify correct handlers were called
    expect(userHandler).toHaveBeenCalledWith(userEvent);
    expect(orderHandler).toHaveBeenCalledWith(orderEvent);
  });

  it("should support dynamic handler registration", async () => {
    const initialHandler = jest.fn().mockResolvedValue(undefined);
    const additionalHandler = jest.fn().mockResolvedValue(undefined);

    // Register initial handler
    await eventProcessor.addHandler("user.created", initialHandler);
    await eventProcessor.start();

    expect(mockEventBus.subscriptions).toHaveLength(1);

    // Add handler after start
    await eventProcessor.addHandler("order.created", additionalHandler);

    expect(mockEventBus.subscriptions).toHaveLength(2);
    expect(eventProcessor.getRegisteredEvents()).toEqual(["user.created", "order.created"]);
  });

  it("should support handler removal", async () => {
    const userHandler = jest.fn().mockResolvedValue(undefined);
    const orderHandler = jest.fn().mockResolvedValue(undefined);

    await eventProcessor.addHandler("user.created", userHandler);
    await eventProcessor.addHandler("order.created", orderHandler);
    await eventProcessor.start();

    expect(eventProcessor.getRegisteredEvents()).toHaveLength(2);

    // Remove handler
    await eventProcessor.removeHandler("user.created");

    expect(eventProcessor.getRegisteredEvents()).toEqual(["order.created"]);
    expect(eventProcessor.hasHandler("user.created")).toBe(false);
    expect(eventProcessor.hasHandler("order.created")).toBe(true);
  });

  it("should prevent starting twice", async () => {
    await eventProcessor.addHandler("user.created", jest.fn());
    await eventProcessor.start();

    await expect(eventProcessor.start()).rejects.toThrow(
      "EventProcessor is already started"
    );
  });

  it("should handle unknown events gracefully", async () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    
    await eventProcessor.addHandler("user.created", jest.fn());
    await eventProcessor.start();

    // Simulate event with no handler
    const unknownEvent: EventBase<{ test: string }> = {
      message: { test: "value" },
      headers: { correlationId: "unknown" }
    };

    // Manually add to queue to simulate unknown event
    (eventProcessor as any).processingQueue.push({
      event: "unknown.event",
      eventData: unknownEvent
    });

    // Process the queue
    await (eventProcessor as any).processNext(
      (eventProcessor as any).options.processingStrategy || 
      new (await import("../defaults")).DefaultEventProcessingStrategy(),
      1
    );

    expect(consoleSpy).toHaveBeenCalledWith("No handler found for event: unknown.event");
    
    consoleSpy.mockRestore();
  });
});
