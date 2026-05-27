import { Result } from "../common/result";
import { DomainEvent } from "../domain/domain-event";
import { EventStore } from "./event-store";
import { VersionConflictError } from "./concurrency";

export class InMemoryEventStore implements EventStore {
  private streams = new Map<string, DomainEvent[]>();

  async appendEvents(
    aggregateId: string,
    expectedVersion: number,
    events: DomainEvent[]
  ): Promise<Result<void>> {
    try {
      const existing = this.streams.get(aggregateId) ?? [];
      const currentVersion = existing.length;

      if (currentVersion !== expectedVersion) {
        return Result.withFailure(
          new VersionConflictError(aggregateId, expectedVersion, currentVersion)
        );
      }

      this.streams.set(aggregateId, [...existing, ...events]);
      return Result.withSuccess();
    } catch (error) {
      return Result.withFailure(error as Error);
    }
  }

  async getEvents(aggregateId: string): Promise<Result<DomainEvent[]>> {
    return Result.withSuccess([...(this.streams.get(aggregateId) ?? [])]);
  }

  async getEventsFromVersion(
    aggregateId: string,
    fromVersion: number
  ): Promise<Result<DomainEvent[]>> {
    const events = this.streams.get(aggregateId) ?? [];
    return Result.withSuccess(events.slice(fromVersion));
  }

  async getEventsByType(eventType: string): Promise<Result<DomainEvent[]>> {
    const result: DomainEvent[] = [];
    for (const events of this.streams.values()) {
      result.push(...events.filter(e => e.type === eventType));
    }
    return Result.withSuccess(result);
  }

  async getEventsByCorrelationId(correlationId: string): Promise<Result<DomainEvent[]>> {
    const result: DomainEvent[] = [];
    for (const events of this.streams.values()) {
      result.push(
        ...events.filter(
          e => (e.metadata as Record<string, unknown>)?.correlationId === correlationId
        )
      );
    }
    return Result.withSuccess(result);
  }

  async getEventsInTimeRange(fromDate: Date, toDate: Date): Promise<Result<DomainEvent[]>> {
    const result: DomainEvent[] = [];
    for (const events of this.streams.values()) {
      result.push(
        ...events.filter(
          e => e.timestamp >= fromDate && e.timestamp <= toDate
        )
      );
    }
    result.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    return Result.withSuccess(result);
  }

  clear(): void {
    this.streams.clear();
  }
}
