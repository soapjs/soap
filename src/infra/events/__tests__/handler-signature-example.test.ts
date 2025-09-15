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
  async subscribe(event: string, handler: (data: EventBase<unknown, Record<string, unknown>>) => void): Promise<void> {
    this.subscriptions.push({ event, handler });
  }
  async unsubscribe(): Promise<void> {}
}

describe("Handler Signature - EventBase vs Payload", () => {
  let mockEventBus: MockEventBus;
  let eventProcessor: EventProcessor;

  beforeEach(() => {
    mockEventBus = new MockEventBus();
    eventProcessor = new EventProcessor(mockEventBus, {});
  });

  it("should demonstrate new handler signature with full EventBase context", async () => {
    // Handler now receives full EventBase instead of just payload
    const userHandler = jest.fn().mockImplementation(async (event: EventBase<{ userId: string; name: string }>) => {
      // Access to full event context
      const payload = event.message;        // { userId: string; name: string }
      const headers = event.headers;        // { correlationId: string; source: string; etc. }
      
      // Use headers for business logic
      if (headers.correlationId) {
        console.log(`Processing user event with correlation: ${headers.correlationId}`);
      }
      
      // Use payload for business logic
      console.log(`Creating user: ${payload.name} (ID: ${payload.userId})`);
      
      // Simulate business logic
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    const orderHandler = jest.fn().mockImplementation(async (event: EventBase<{ orderId: string; amount: number }>) => {
      // Access to full event context
      const payload = event.message;
      const headers = event.headers;
      
      // Use headers for tracing
      console.log(`Processing order event from source: ${headers.source}`);
      
      // Use payload for business logic
      console.log(`Processing order: ${payload.orderId} for $${payload.amount}`);
      
      // Simulate business logic
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    // Register handlers
    await eventProcessor.addHandler("user.created", userHandler);
    await eventProcessor.addHandler("order.created", orderHandler);
    await eventProcessor.start();

    // Simulate incoming events with full context
    const userEvent: EventBase<{ userId: string; name: string }> = {
      message: { userId: "123", name: "John Doe" },
      headers: { 
        correlationId: "user-corr-123",
        source: "user-service",
        timestamp: new Date().toISOString()
      }
    };

    const orderEvent: EventBase<{ orderId: string; amount: number }> = {
      message: { orderId: "order-456", amount: 99.99 },
      headers: { 
        correlationId: "order-corr-456",
        source: "order-service",
        timestamp: new Date().toISOString()
      }
    };

    // Process events
    const userSubscription = mockEventBus.subscriptions.find(s => s.event === "user.created");
    const orderSubscription = mockEventBus.subscriptions.find(s => s.event === "order.created");

    await userSubscription!.handler(userEvent);
    await orderSubscription!.handler(orderEvent);

    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 50));

    // Verify handlers were called with full EventBase
    expect(userHandler).toHaveBeenCalledWith(userEvent);
    expect(orderHandler).toHaveBeenCalledWith(orderEvent);
  });

  it("should demonstrate benefits of full EventBase context", async () => {
    const handler = jest.fn().mockImplementation(async (event: EventBase<{ data: string }>) => {
      // Access to correlation ID for tracing
      const correlationId = event.headers.correlationId;
      
      // Access to source for routing decisions
      const source = event.headers.source;
      
      // Access to custom headers for business logic
      const priority = event.headers.priority as string;
      
      // Access to payload for main business logic
      const data = event.message.data;
      
      // Use all context for comprehensive processing
      console.log(`Processing ${data} from ${source} with priority ${priority} (correlation: ${correlationId})`);
      
      // Simulate conditional logic based on headers
      if (priority === "high") {
        console.log("High priority event - processing immediately");
      } else {
        console.log("Normal priority event - queuing for batch processing");
      }
    });

    await eventProcessor.addHandler("test.event", handler);
    await eventProcessor.start();

    const event: EventBase<{ data: string }> = {
      message: { data: "important data" },
      headers: { 
        correlationId: "trace-123",
        source: "api-gateway",
        priority: "high",
        userId: "user-456",
        requestId: "req-789"
      }
    };

    const subscription = mockEventBus.subscriptions[0];
    await subscription.handler(event);

    await new Promise(resolve => setTimeout(resolve, 10));

    expect(handler).toHaveBeenCalledWith(event);
  });

  it("should work with retry logic and error handling", async () => {
    let attemptCount = 0;
    const handler = jest.fn().mockImplementation(async (event: EventBase<{ data: string }>) => {
      attemptCount++;
      
      // Access to correlation ID for retry tracking
      const correlationId = event.headers.correlationId;
      console.log(`Attempt ${attemptCount} for correlation ${correlationId}`);
      
      if (attemptCount < 3) {
        throw new Error("Temporary failure");
      }
      
      // Success on 3rd attempt
      console.log(`Successfully processed ${event.message.data}`);
    });

    const processor = new EventProcessor(mockEventBus, {
      retries: 3,
      retryDelay: 50,
      backoff: { type: "fixed", jitter: false },
      callbacks: {
        onRetry: (error, event, attempt) => {
          console.log(`Retry ${attempt} for correlation ${event.headers.correlationId}: ${error.message}`);
        },
        onError: (error, event) => {
          console.log(`Error for correlation ${event.headers.correlationId}: ${error.message}`);
        }
      }
    });

    await processor.addHandler("test.event", handler);
    await processor.start();

    const event: EventBase<{ data: string }> = {
      message: { data: "retry test data" },
      headers: { 
        correlationId: "retry-corr-123",
        source: "test-service"
      }
    };

    const subscription = mockEventBus.subscriptions[0];
    await subscription.handler(event);

    // Wait for all retries to complete
    await new Promise(resolve => setTimeout(resolve, 300));

    expect(handler).toHaveBeenCalledTimes(3);
  });
});












