import {
  DomainEventBus,
  DomainEventConsumer,
  InMemoryDomainEventBus,
} from "../domain-event-bus";
import { BaseDomainEvent } from "../../domain/domain-event";

class CharacterCreated extends BaseDomainEvent<{ name: string }> {
  constructor(name: string) {
    super("character.created", `char_${name}`, { name });
  }
}

class CharacterDeleted extends BaseDomainEvent<{ id: string }> {
  constructor(id: string) {
    super("character.deleted", id, { id });
  }
}

class RecordingConsumer
  implements DomainEventConsumer<CharacterCreated | CharacterDeleted>
{
  received: Array<CharacterCreated | CharacterDeleted> = [];
  async handle(event: CharacterCreated | CharacterDeleted): Promise<void> {
    this.received.push(event);
  }
}

describe("DomainEventBus port", () => {
  it("exposes a stable DI token", () => {
    expect(DomainEventBus.Token).toBe("DomainEventBus");
  });
});

describe("InMemoryDomainEventBus", () => {
  it("delivers to every consumer subscribed for the event type", async () => {
    const bus = new InMemoryDomainEventBus();
    const a = new RecordingConsumer();
    const b = new RecordingConsumer();

    bus.subscribe(CharacterCreated, a);
    bus.subscribe(CharacterCreated, b);

    const event = new CharacterCreated("Spider-Man");
    await bus.publish(event);

    expect(a.received).toEqual([event]);
    expect(b.received).toEqual([event]);
  });

  it("routes events by class identity, not by `type` string", async () => {
    const bus = new InMemoryDomainEventBus();
    const created = new RecordingConsumer();
    const deleted = new RecordingConsumer();
    bus.subscribe(CharacterCreated, created);
    bus.subscribe(CharacterDeleted, deleted);

    await bus.publish(new CharacterCreated("Iron Man"));
    await bus.publish(new CharacterDeleted("doctor-doom"));

    expect(created.received).toHaveLength(1);
    expect(deleted.received).toHaveLength(1);
    expect(created.received[0]).toBeInstanceOf(CharacterCreated);
    expect(deleted.received[0]).toBeInstanceOf(CharacterDeleted);
  });

  it("no-ops when there are no subscribers for the event", async () => {
    const bus = new InMemoryDomainEventBus();
    await expect(bus.publish(new CharacterCreated("Hulk"))).resolves.toBeUndefined();
  });

  it("deduplicates subscriptions: subscribing the same consumer twice yields one delivery", async () => {
    const bus = new InMemoryDomainEventBus();
    const a = new RecordingConsumer();

    bus.subscribe(CharacterCreated, a);
    bus.subscribe(CharacterCreated, a);

    expect(bus.consumerCount(CharacterCreated)).toBe(1);
    await bus.publish(new CharacterCreated("Black Widow"));
    expect(a.received).toHaveLength(1);
  });

  it("isolates a throwing consumer so the rest still receive the event", async () => {
    // Suppress the deliberately-printed error inside the bus.
    const errSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);

    const bus = new InMemoryDomainEventBus();
    const fail: DomainEventConsumer<CharacterCreated> = {
      handle: () => {
        throw new Error("consumer blew up");
      },
    };
    const ok = new RecordingConsumer();
    bus.subscribe(CharacterCreated, fail);
    bus.subscribe(CharacterCreated, ok);

    await bus.publish(new CharacterCreated("Captain America"));

    expect(ok.received).toHaveLength(1);
    errSpy.mockRestore();
  });

  it("snapshots the consumer list so a subscribe-during-dispatch does not affect this publish", async () => {
    const bus = new InMemoryDomainEventBus();
    const events: string[] = [];

    const a: DomainEventConsumer<CharacterCreated> = {
      handle: () => {
        events.push("a");
        // Subscribe a new consumer mid-fan-out — must NOT be invoked for this publish.
        bus.subscribe(CharacterCreated, {
          handle: () => {
            events.push("late-arrival");
          },
        });
      },
    };
    const b: DomainEventConsumer<CharacterCreated> = {
      handle: () => {
        events.push("b");
      },
    };
    bus.subscribe(CharacterCreated, a);
    bus.subscribe(CharacterCreated, b);

    await bus.publish(new CharacterCreated("Thor"));
    expect(events).toEqual(["a", "b"]);

    // Second publish should reach the late arrival.
    await bus.publish(new CharacterCreated("Loki"));
    expect(events.filter((e) => e === "late-arrival")).toHaveLength(1);
  });

  it("awaits async consumers so back-pressure surfaces to the publisher", async () => {
    const bus = new InMemoryDomainEventBus();
    let resolved = false;
    bus.subscribe<CharacterCreated>(CharacterCreated, {
      handle: async () => {
        await new Promise((r) => setTimeout(r, 20));
        resolved = true;
      },
    });

    await bus.publish(new CharacterCreated("Vision"));
    expect(resolved).toBe(true);
  });
});
