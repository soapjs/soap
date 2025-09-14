import { ExternalEvent } from "../external-event";

describe("ExternalEvent", () => {
  describe("interface compliance", () => {
    it("should create a valid ExternalEvent with all required fields", () => {
      const externalEvent: ExternalEvent = {
        type: "user.created",
        timestamp: new Date("2023-01-01T00:00:00Z"),
        data: { userId: "123", name: "John Doe" },
        correlationId: "corr-123",
        source: "user-service"
      };

      expect(externalEvent.type).toBe("user.created");
      expect(externalEvent.timestamp).toEqual(new Date("2023-01-01T00:00:00Z"));
      expect(externalEvent.data).toEqual({ userId: "123", name: "John Doe" });
      expect(externalEvent.correlationId).toBe("corr-123");
      expect(externalEvent.source).toBe("user-service");
    });

    it("should create a valid ExternalEvent with optional fields", () => {
      const externalEvent: ExternalEvent = {
        id: "evt-456",
        type: "order.paid",
        timestamp: new Date("2023-01-01T00:00:00Z"),
        data: { orderId: "order-789", amount: 100 },
        correlationId: "corr-456",
        causationId: "evt-123",
        source: "payment-service",
        destination: "notification-service",
        metadata: {
          version: "1.0",
          priority: "high",
          tags: ["payment", "order"]
        }
      };

      expect(externalEvent.id).toBe("evt-456");
      expect(externalEvent.causationId).toBe("evt-123");
      expect(externalEvent.destination).toBe("notification-service");
      expect(externalEvent.metadata).toEqual({
        version: "1.0",
        priority: "high",
        tags: ["payment", "order"]
      });
    });

    it("should work with typed data", () => {
      interface UserData {
        userId: string;
        name: string;
        email: string;
      }

      const externalEvent: ExternalEvent<UserData> = {
        type: "user.updated",
        timestamp: new Date(),
        data: {
          userId: "123",
          name: "John Doe",
          email: "john@example.com"
        },
        correlationId: "corr-789",
        source: "user-service"
      };

      expect(externalEvent.data.userId).toBe("123");
      expect(externalEvent.data.name).toBe("John Doe");
      expect(externalEvent.data.email).toBe("john@example.com");
    });

    it("should work with empty data object", () => {
      const externalEvent: ExternalEvent = {
        type: "system.heartbeat",
        timestamp: new Date(),
        data: {},
        correlationId: "corr-heartbeat",
        source: "system-service"
      };

      expect(externalEvent.data).toEqual({});
    });

    it("should work with complex nested data", () => {
      interface OrderData {
        orderId: string;
        customer: {
          id: string;
          name: string;
          address: {
            street: string;
            city: string;
            zipCode: string;
          };
        };
        items: Array<{
          id: string;
          name: string;
          quantity: number;
          price: number;
        }>;
        total: number;
      }

      const externalEvent: ExternalEvent<OrderData> = {
        type: "order.completed",
        timestamp: new Date(),
        data: {
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
        },
        correlationId: "corr-order-123",
        source: "order-service"
      };

      expect(externalEvent.data.orderId).toBe("order-123");
      expect(externalEvent.data.customer.name).toBe("Jane Doe");
      expect(externalEvent.data.customer.address.city).toBe("New York");
      expect(externalEvent.data.items).toHaveLength(2);
      expect(externalEvent.data.items[0].name).toBe("Product A");
      expect(externalEvent.data.total).toBe(101.97);
    });
  });

  describe("field validation", () => {
    // Note: TypeScript compile-time validation is tested by the compiler itself
    // These tests focus on runtime behavior

    it("should make id optional", () => {
      const externalEvent: ExternalEvent = {
        type: "test.event",
        timestamp: new Date(),
        data: {},
        correlationId: "corr-123",
        source: "test-service"
        // id is not provided - should be fine
      };

      expect(externalEvent.id).toBeUndefined();
    });

    it("should make causationId optional", () => {
      const externalEvent: ExternalEvent = {
        type: "test.event",
        timestamp: new Date(),
        data: {},
        correlationId: "corr-123",
        source: "test-service"
        // causationId is not provided - should be fine
      };

      expect(externalEvent.causationId).toBeUndefined();
    });

    it("should make destination optional", () => {
      const externalEvent: ExternalEvent = {
        type: "test.event",
        timestamp: new Date(),
        data: {},
        correlationId: "corr-123",
        source: "test-service"
        // destination is not provided - should be fine
      };

      expect(externalEvent.destination).toBeUndefined();
    });

    it("should make metadata optional", () => {
      const externalEvent: ExternalEvent = {
        type: "test.event",
        timestamp: new Date(),
        data: {},
        correlationId: "corr-123",
        source: "test-service"
        // metadata is not provided - should be fine
      };

      expect(externalEvent.metadata).toBeUndefined();
    });
  });

  describe("readonly properties", () => {
    // Note: readonly properties are enforced at compile time by TypeScript
    // Runtime modification is not prevented by the interface definition
    it("should have properties accessible at runtime", () => {
      const externalEvent: ExternalEvent = {
        type: "test.event",
        timestamp: new Date(),
        data: { test: "value" },
        correlationId: "corr-123",
        source: "test-service"
      };

      expect(externalEvent.type).toBe("test.event");
      expect(externalEvent.correlationId).toBe("corr-123");
      expect(externalEvent.source).toBe("test-service");
    });
  });
});
