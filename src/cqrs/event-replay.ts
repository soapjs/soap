import { Result } from "../common/result";
import { DomainEvent } from "../domain/domain-event";
import { EventStore } from "./event-store";

/**
 * Event Replay Strategy - defines how events should be replayed
 */
export enum ReplayStrategy {
  /**
   * Replay events in chronological order
   */
  CHRONOLOGICAL = 'chronological',
  
  /**
   * Replay events grouped by aggregate
   */
  BY_AGGREGATE = 'by_aggregate',
  
  /**
   * Replay events by type
   */
  BY_TYPE = 'by_type',
  
  /**
   * Replay events by correlation ID
   */
  BY_CORRELATION = 'by_correlation'
}

/**
 * Replay Options for configuring event replay behavior
 */
export interface ReplayOptions {
  /**
   * Strategy for replaying events
   */
  strategy: ReplayStrategy;
  
  /**
   * Start date for replay (optional)
   */
  fromDate?: Date;
  
  /**
   * End date for replay (optional)
   */
  toDate?: Date;
  
  /**
   * Specific aggregate IDs to replay (optional)
   */
  aggregateIds?: string[];
  
  /**
   * Specific event types to replay (optional)
   */
  eventTypes?: string[];
  
  /**
   * Specific correlation ID to replay (optional)
   */
  correlationId?: string;
  
  /**
   * Whether to include snapshots in replay
   */
  includeSnapshots?: boolean;
  
  /**
   * Batch size for processing events
   */
  batchSize?: number;
  
  /**
   * Whether to replay in reverse order
   */
  reverse?: boolean;
}

/**
 * Replay Progress tracking
 */
export interface ReplayProgress {
  /**
   * Total number of events to replay
   */
  totalEvents: number;
  
  /**
   * Number of events processed
   */
  processedEvents: number;
  
  /**
   * Number of events failed
   */
  failedEvents: number;
  
  /**
   * Current progress percentage
   */
  progressPercentage: number;
  
  /**
   * Start time of replay
   */
  startTime: Date;
  
  /**
   * Estimated completion time
   */
  estimatedCompletion?: Date;
  
  /**
   * Current event being processed
   */
  currentEvent?: DomainEvent;
}

/**
 * Event Replay Handler - processes individual events during replay
 */
export interface EventReplayHandler {
  /**
   * Handle a single event during replay
   */
  handleEvent(event: DomainEvent): Promise<Result<void>>;
  
  /**
   * Handle batch of events during replay
   */
  handleBatch(events: DomainEvent[]): Promise<Result<void>>;
  
  /**
   * Called when replay starts
   */
  onReplayStart?(options: ReplayOptions): Promise<Result<void>>;
  
  /**
   * Called when replay completes
   */
  onReplayComplete?(progress: ReplayProgress): Promise<Result<void>>;
  
  /**
   * Called when replay fails
   */
  onReplayError?(error: Error, event?: DomainEvent): Promise<Result<void>>;
}

/**
 * Event Replay Manager - orchestrates event replay operations
 */
export interface EventReplayManager {
  /**
   * Start replaying events with given options
   */
  startReplay(
    options: ReplayOptions,
    handler: EventReplayHandler
  ): Promise<Result<string>>; // Returns replay ID
  
  /**
   * Get replay progress by ID
   */
  getReplayProgress(replayId: string): Promise<Result<ReplayProgress>>;
  
  /**
   * Cancel an ongoing replay
   */
  cancelReplay(replayId: string): Promise<Result<void>>;
  
  /**
   * Get all active replays
   */
  getActiveReplays(): Promise<Result<string[]>>;
  
  /**
   * Get replay history
   */
  getReplayHistory(): Promise<Result<ReplayHistory[]>>;
}

/**
 * Replay History entry
 */
export interface ReplayHistory {
  readonly replayId: string;
  readonly options: ReplayOptions;
  readonly startTime: Date;
  readonly endTime?: Date;
  readonly status: 'running' | 'completed' | 'failed' | 'cancelled';
  readonly totalEvents: number;
  readonly processedEvents: number;
  readonly failedEvents: number;
  readonly error?: string;
}

/**
 * Base implementation of Event Replay Manager
 */
export class BaseEventReplayManager implements EventReplayManager {
  private activeReplays = new Map<string, {
    options: ReplayOptions;
    handler: EventReplayHandler;
    progress: ReplayProgress;
    cancelled: boolean;
  }>();
  
  private replayHistory: ReplayHistory[] = [];
  
  constructor(private eventStore: EventStore) {}
  
  async startReplay(
    options: ReplayOptions,
    handler: EventReplayHandler
  ): Promise<Result<string>> {
    try {
      const replayId = this.generateReplayId();
      
      // Initialize progress tracking
      const progress: ReplayProgress = {
        totalEvents: 0,
        processedEvents: 0,
        failedEvents: 0,
        progressPercentage: 0,
        startTime: new Date()
      };
      
      // Store replay info
      this.activeReplays.set(replayId, {
        options,
        handler,
        progress,
        cancelled: false
      });
      
      // Add to history
      this.replayHistory.push({
        replayId,
        options,
        startTime: progress.startTime,
        status: 'running',
        totalEvents: 0,
        processedEvents: 0,
        failedEvents: 0
      });
      
      // Start replay in background
      this.executeReplay(replayId).catch(error => {
        console.error(`Replay ${replayId} failed:`, error);
      });
      
      return Result.withSuccess(replayId);
    } catch (error) {
      return Result.withFailure(error as Error);
    }
  }
  
  async getReplayProgress(replayId: string): Promise<Result<ReplayProgress>> {
    const replay = this.activeReplays.get(replayId);
    if (!replay) {
      return Result.withFailure(new Error(`Replay ${replayId} not found`));
    }
    
    return Result.withSuccess(replay.progress);
  }
  
  async cancelReplay(replayId: string): Promise<Result<void>> {
    const replay = this.activeReplays.get(replayId);
    if (!replay) {
      return Result.withFailure(new Error(`Replay ${replayId} not found`));
    }
    
    replay.cancelled = true;
    
    // Update history
    const historyEntry = this.replayHistory.find(h => h.replayId === replayId);
    if (historyEntry) {
      historyEntry.status = 'cancelled';
      historyEntry.endTime = new Date();
    }
    
    return Result.withSuccess();
  }
  
  async getActiveReplays(): Promise<Result<string[]>> {
    return Result.withSuccess(Array.from(this.activeReplays.keys()));
  }
  
  async getReplayHistory(): Promise<Result<ReplayHistory[]>> {
    return Result.withSuccess([...this.replayHistory]);
  }
  
  private async executeReplay(replayId: string): Promise<void> {
    const replay = this.activeReplays.get(replayId);
    if (!replay) return;
    
    try {
      const { options, handler, progress } = replay;
      
      // Call handler's onReplayStart
      if (handler.onReplayStart) {
        const result = await handler.onReplayStart(options);
        if (result.isFailure) {
          throw result.error;
        }
      }
      
      // Get events based on options
      const eventsResult = await this.getEventsForReplay(options);
      if (eventsResult.isFailure) {
        throw eventsResult.error;
      }
      
      const events = eventsResult.data;
      progress.totalEvents = events.length;
      
      // Process events in batches
      const batchSize = options.batchSize || 100;
      const batches = this.createBatches(events, batchSize);
      
      for (const batch of batches) {
        if (replay.cancelled) {
          break;
        }
        
        try {
          // Process batch
          const result = await handler.handleBatch(batch);
          if (result.isFailure) {
            progress.failedEvents += batch.length;
            if (handler.onReplayError) {
              await handler.onReplayError(result.error);
            }
          } else {
            progress.processedEvents += batch.length;
          }
          
          // Update progress
          progress.progressPercentage = (progress.processedEvents / progress.totalEvents) * 100;
          
        } catch (error) {
          progress.failedEvents += batch.length;
          if (handler.onReplayError) {
            await handler.onReplayError(error as Error);
          }
        }
      }
      
      // Call handler's onReplayComplete
      if (handler.onReplayComplete) {
        await handler.onReplayComplete(progress);
      }
      
      // Update history
      const historyEntry = this.replayHistory.find(h => h.replayId === replayId);
      if (historyEntry) {
        historyEntry.status = replay.cancelled ? 'cancelled' : 'completed';
        historyEntry.endTime = new Date();
        historyEntry.totalEvents = progress.totalEvents;
        historyEntry.processedEvents = progress.processedEvents;
        historyEntry.failedEvents = progress.failedEvents;
      }
      
      // Remove from active replays
      this.activeReplays.delete(replayId);
      
    } catch (error) {
      // Update history with error
      const historyEntry = this.replayHistory.find(h => h.replayId === replayId);
      if (historyEntry) {
        historyEntry.status = 'failed';
        historyEntry.endTime = new Date();
        historyEntry.error = (error as Error).message;
      }
      
      this.activeReplays.delete(replayId);
    }
  }
  
  private async getEventsForReplay(options: ReplayOptions): Promise<Result<DomainEvent[]>> {
    try {
      let events: DomainEvent[] = [];
      
      switch (options.strategy) {
        case ReplayStrategy.CHRONOLOGICAL:
          if (options.fromDate && options.toDate) {
            const result = await this.eventStore.getEventsInTimeRange(
              options.fromDate,
              options.toDate
            );
            if (result.isFailure) return result;
            events = result.data;
          } else {
            // Get all events (this might need pagination in real implementation)
            events = [];
          }
          break;
          
        case ReplayStrategy.BY_AGGREGATE:
          if (options.aggregateIds) {
            for (const aggregateId of options.aggregateIds) {
              const result = await this.eventStore.getEvents(aggregateId);
              if (result.isFailure) return result;
              events.push(...result.data);
            }
          }
          break;
          
        case ReplayStrategy.BY_TYPE:
          if (options.eventTypes) {
            for (const eventType of options.eventTypes) {
              const result = await this.eventStore.getEventsByType(eventType);
              if (result.isFailure) return result;
              events.push(...result.data);
            }
          }
          break;
          
        case ReplayStrategy.BY_CORRELATION:
          if (options.correlationId) {
            const result = await this.eventStore.getEventsByCorrelationId(options.correlationId);
            if (result.isFailure) return result;
            events = result.data;
          }
          break;
      }
      
      // Sort events by timestamp
      events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      
      // Reverse if requested
      if (options.reverse) {
        events.reverse();
      }
      
      return Result.withSuccess(events);
    } catch (error) {
      return Result.withFailure(error as Error);
    }
  }
  
  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }
  
  private generateReplayId(): string {
    return `replay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
