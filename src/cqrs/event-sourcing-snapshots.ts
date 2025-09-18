import { Result } from "../common/result";
import { DomainEvent } from "../domain/domain-event";
import { EventStore } from "./event-store";

/**
 * Snapshot Strategy - defines when and how snapshots are created
 */
export enum SnapshotStrategy {
  /**
   * Create snapshots at regular intervals
   */
  INTERVAL = 'interval',
  
  /**
   * Create snapshots when event count threshold is reached
   */
  EVENT_COUNT = 'event_count',
  
  /**
   * Create snapshots when time threshold is reached
   */
  TIME_THRESHOLD = 'time_threshold',
  
  /**
   * Create snapshots manually
   */
  MANUAL = 'manual',
  
  /**
   * Create snapshots based on aggregate state changes
   */
  STATE_CHANGE = 'state_change'
}

/**
 * Snapshot - represents a snapshot of aggregate state
 */
export interface Snapshot {
  /**
   * Unique snapshot ID
   */
  readonly snapshotId: string;
  
  /**
   * Aggregate ID this snapshot belongs to
   */
  readonly aggregateId: string;
  
  /**
   * Aggregate type
   */
  readonly aggregateType: string;
  
  /**
   * Snapshot version (corresponds to aggregate version)
   */
  readonly version: number;
  
  /**
   * Snapshot data (serialized aggregate state)
   */
  readonly data: Record<string, unknown>;
  
  /**
   * Snapshot metadata
   */
  readonly metadata: SnapshotMetadata;
  
  /**
   * Created timestamp
   */
  readonly createdAt: Date;
  
  /**
   * Whether this snapshot is active
   */
  readonly active: boolean;
}

/**
 * Snapshot Metadata
 */
export interface SnapshotMetadata {
  /**
   * Strategy used to create this snapshot
   */
  readonly strategy: SnapshotStrategy;
  
  /**
   * Number of events since last snapshot
   */
  readonly eventsSinceLastSnapshot: number;
  
  /**
   * Time since last snapshot (in milliseconds)
   */
  readonly timeSinceLastSnapshot: number;
  
  /**
   * Snapshot size in bytes
   */
  readonly sizeInBytes: number;
  
  /**
   * Compression ratio (if compressed)
   */
  readonly compressionRatio?: number;
  
  /**
   * Checksum for data integrity
   */
  readonly checksum: string;
  
  /**
   * Custom metadata
   */
  readonly customData?: Record<string, unknown>;
}

/**
 * Snapshot Configuration - configuration for snapshot creation
 */
export interface SnapshotConfiguration {
  /**
   * Snapshot strategy
   */
  readonly strategy: SnapshotStrategy;
  
  /**
   * Event count threshold (for EVENT_COUNT strategy)
   */
  readonly eventCountThreshold?: number;
  
  /**
   * Time threshold in milliseconds (for TIME_THRESHOLD strategy)
   */
  readonly timeThreshold?: number;
  
  /**
   * Interval in milliseconds (for INTERVAL strategy)
   */
  readonly interval?: number;
  
  /**
   * Whether to compress snapshots
   */
  readonly compress?: boolean;
  
  /**
   * Compression algorithm
   */
  readonly compressionAlgorithm?: CompressionAlgorithm;
  
  /**
   * Whether to encrypt snapshots
   */
  readonly encrypt?: boolean;
  
  /**
   * Encryption algorithm
   */
  readonly encryptionAlgorithm?: EncryptionAlgorithm;
  
  /**
   * Maximum number of snapshots to keep
   */
  readonly maxSnapshots?: number;
  
  /**
   * Whether to automatically clean up old snapshots
   */
  readonly autoCleanup?: boolean;
}

/**
 * Compression Algorithm
 */
export enum CompressionAlgorithm {
  GZIP = 'gzip',
  DEFLATE = 'deflate',
  BROTLI = 'brotli',
  LZ4 = 'lz4'
}

/**
 * Encryption Algorithm
 */
export enum EncryptionAlgorithm {
  AES256 = 'aes256',
  AES128 = 'aes128',
  CHACHA20 = 'chacha20'
}

/**
 * Snapshot Store - interface for storing and retrieving snapshots
 */
export interface SnapshotStore {
  /**
   * Save a snapshot
   */
  saveSnapshot(snapshot: Snapshot): Promise<Result<void>>;
  
  /**
   * Get the latest snapshot for an aggregate
   */
  getLatestSnapshot(aggregateId: string): Promise<Result<Snapshot>>;
  
  /**
   * Get snapshot by ID
   */
  getSnapshot(snapshotId: string): Promise<Result<Snapshot>>;
  
  /**
   * Get all snapshots for an aggregate
   */
  getSnapshots(aggregateId: string): Promise<Result<Snapshot[]>>;
  
  /**
   * Get snapshots in version range
   */
  getSnapshotsInRange(
    aggregateId: string,
    fromVersion: number,
    toVersion: number
  ): Promise<Result<Snapshot[]>>;
  
  /**
   * Delete a snapshot
   */
  deleteSnapshot(snapshotId: string): Promise<Result<void>>;
  
  /**
   * Delete old snapshots for an aggregate
   */
  deleteOldSnapshots(
    aggregateId: string,
    keepCount: number
  ): Promise<Result<void>>;
  
  /**
   * Get snapshot statistics
   */
  getSnapshotStatistics(): Promise<Result<SnapshotStatistics>>;
}

/**
 * Snapshot Statistics
 */
export interface SnapshotStatistics {
  /**
   * Total number of snapshots
   */
  readonly totalSnapshots: number;
  
  /**
   * Total size of all snapshots in bytes
   */
  readonly totalSizeInBytes: number;
  
  /**
   * Average snapshot size in bytes
   */
  readonly averageSizeInBytes: number;
  
  /**
   * Snapshots by strategy
   */
  readonly snapshotsByStrategy: Record<SnapshotStrategy, number>;
  
  /**
   * Snapshots by aggregate type
   */
  readonly snapshotsByAggregateType: Record<string, number>;
  
  /**
   * Compression statistics
   */
  readonly compressionStats: {
    compressedSnapshots: number;
    averageCompressionRatio: number;
    totalSpaceSaved: number;
  };
}

/**
 * Snapshot Manager - manages snapshot creation and retrieval
 */
export interface SnapshotManager {
  /**
   * Create a snapshot for an aggregate
   */
  createSnapshot(
    aggregateId: string,
    aggregateType: string,
    aggregateState: Record<string, unknown>,
    version: number,
    configuration?: SnapshotConfiguration
  ): Promise<Result<Snapshot>>;
  
  /**
   * Restore aggregate from snapshot and events
   */
  restoreAggregate(
    aggregateId: string,
    targetVersion?: number
  ): Promise<Result<{
    snapshot?: Snapshot;
    events: DomainEvent[];
    restoredState: Record<string, unknown>;
  }>>;
  
  /**
   * Get the best snapshot for an aggregate at a specific version
   */
  getBestSnapshot(
    aggregateId: string,
    targetVersion: number
  ): Promise<Result<Snapshot>>;
  
  /**
   * Check if snapshot should be created
   */
  shouldCreateSnapshot(
    aggregateId: string,
    currentVersion: number,
    configuration: SnapshotConfiguration
  ): Promise<Result<boolean>>;
  
  /**
   * Clean up old snapshots
   */
  cleanupSnapshots(
    aggregateId: string,
    configuration: SnapshotConfiguration
  ): Promise<Result<void>>;
  
  /**
   * Get snapshot configuration for aggregate type
   */
  getSnapshotConfiguration(aggregateType: string): Promise<Result<SnapshotConfiguration>>;
  
  /**
   * Set snapshot configuration for aggregate type
   */
  setSnapshotConfiguration(
    aggregateType: string,
    configuration: SnapshotConfiguration
  ): Promise<Result<void>>;
}

/**
 * Base implementation of Snapshot Manager
 */
export class BaseSnapshotManager implements SnapshotManager {
  private configurations = new Map<string, SnapshotConfiguration>();
  private lastSnapshotVersions = new Map<string, number>();
  private lastSnapshotTimes = new Map<string, Date>();
  
  constructor(
    private snapshotStore: SnapshotStore,
    private eventStore: EventStore,
    private serializer?: SnapshotSerializer,
    private compressor?: SnapshotCompressor,
    private encryptor?: SnapshotEncryptor
  ) {
    // Set default configurations
    this.setDefaultConfigurations();
  }
  
  async createSnapshot(
    aggregateId: string,
    aggregateType: string,
    aggregateState: Record<string, unknown>,
    version: number,
    configuration?: SnapshotConfiguration
  ): Promise<Result<Snapshot>> {
    try {
      const config = configuration || await this.getSnapshotConfiguration(aggregateType);
      if (config.isFailure) {
        return Result.withFailure(config.error);
      }
      
      const snapshotId = this.generateSnapshotId();
      
      // Serialize aggregate state
      let serializedData: string;
      if (this.serializer) {
        const serializationResult = await this.serializer.serialize(aggregateState);
        if (serializationResult.isFailure) {
          return Result.withFailure(serializationResult.error);
        }
        serializedData = serializationResult.data;
      } else {
        serializedData = JSON.stringify(aggregateState);
      }
      
      // Compress if configured
      let compressedData = serializedData;
      let compressionRatio: number | undefined;
      if (config.data.compress && this.compressor) {
        const compressionResult = await this.compressor.compress(serializedData, config.data.compressionAlgorithm);
        if (compressionResult.isFailure) {
          return Result.withFailure(compressionResult.error);
        }
        compressedData = compressionResult.data.compressedData;
        compressionRatio = compressionResult.data.compressionRatio;
      }
      
      // Encrypt if configured
      let finalData = compressedData;
      if (config.data.encrypt && this.encryptor) {
        const encryptionResult = await this.encryptor.encrypt(compressedData, config.data.encryptionAlgorithm);
        if (encryptionResult.isFailure) {
          return Result.withFailure(encryptionResult.error);
        }
        finalData = encryptionResult.data;
      }
      
      // Calculate checksum
      const checksum = this.calculateChecksum(finalData);
      
      // Get previous snapshot info
      const lastSnapshot = await this.snapshotStore.getLatestSnapshot(aggregateId);
      const eventsSinceLastSnapshot = lastSnapshot.isSuccess ? 
        version - lastSnapshot.data.version : version;
      const timeSinceLastSnapshot = lastSnapshot.isSuccess ?
        Date.now() - lastSnapshot.data.createdAt.getTime() : 0;
      
      // Create snapshot
      const snapshot: Snapshot = {
        snapshotId,
        aggregateId,
        aggregateType,
        version,
        data: { serializedData: finalData },
        metadata: {
          strategy: config.data.strategy,
          eventsSinceLastSnapshot,
          timeSinceLastSnapshot,
          sizeInBytes: Buffer.byteLength(finalData, 'utf8'),
          compressionRatio,
          checksum,
          customData: {
            originalSize: Buffer.byteLength(serializedData, 'utf8'),
            compressed: config.data.compress,
            encrypted: config.data.encrypt
          }
        },
        createdAt: new Date(),
        active: true
      };
      
      // Save snapshot
      const saveResult = await this.snapshotStore.saveSnapshot(snapshot);
      if (saveResult.isFailure) {
        return Result.withFailure(saveResult.error);
      }
      
      // Update tracking
      this.lastSnapshotVersions.set(aggregateId, version);
      this.lastSnapshotTimes.set(aggregateId, new Date());
      
      // Clean up old snapshots if configured
      if (config.data.autoCleanup) {
        await this.cleanupSnapshots(aggregateId, config.data);
      }
      
      return Result.withSuccess(snapshot);
    } catch (error) {
      return Result.withFailure(error as Error);
    }
  }
  
  async restoreAggregate(
    aggregateId: string,
    targetVersion?: number
  ): Promise<Result<{
    snapshot?: Snapshot;
    events: DomainEvent[];
    restoredState: Record<string, unknown>;
  }>> {
    try {
      // Get the best snapshot
      const snapshotResult = await this.getBestSnapshot(aggregateId, targetVersion || Number.MAX_SAFE_INTEGER);
      let snapshot: Snapshot | undefined;
      let startVersion = 0;
      
      if (snapshotResult.isSuccess) {
        snapshot = snapshotResult.data;
        startVersion = snapshot.version + 1;
      }
      
      // Get events from snapshot version onwards
      const eventsResult = await this.eventStore.getEventsFromVersion(aggregateId, startVersion);
      if (eventsResult.isFailure) {
        return Result.withFailure(eventsResult.error);
      }
      
      let events = eventsResult.data;
      
      // Filter events to target version if specified
      if (targetVersion !== undefined) {
        events = events.filter(event => {
          const eventVersion = (event as any).version || 0;
          return eventVersion <= targetVersion;
        });
      }
      
      // Restore state
      let restoredState: Record<string, unknown> = {};
      
      if (snapshot) {
        // Deserialize snapshot data
        const deserializationResult = await this.deserializeSnapshot(snapshot);
        if (deserializationResult.isFailure) {
          return Result.withFailure(deserializationResult.error);
        }
        restoredState = deserializationResult.data;
      }
      
      // Apply events to restore state
      for (const event of events) {
        restoredState = await this.applyEventToState(restoredState, event);
      }
      
      return Result.withSuccess({
        snapshot,
        events,
        restoredState
      });
    } catch (error) {
      return Result.withFailure(error as Error);
    }
  }
  
  async getBestSnapshot(
    aggregateId: string,
    targetVersion: number
  ): Promise<Result<Snapshot>> {
    try {
      const snapshotsResult = await this.snapshotStore.getSnapshots(aggregateId);
      if (snapshotsResult.isFailure) {
        return Result.withFailure(snapshotsResult.error);
      }
      
      const snapshots = snapshotsResult.data;
      
      // Find the snapshot with the highest version that's <= targetVersion
      const bestSnapshot = snapshots
        .filter(s => s.version <= targetVersion)
        .sort((a, b) => b.version - a.version)[0];
      
      if (!bestSnapshot) {
        return Result.withFailure(new Error(`No snapshot found for aggregate ${aggregateId} at version ${targetVersion}`));
      }
      
      return Result.withSuccess(bestSnapshot);
    } catch (error) {
      return Result.withFailure(error as Error);
    }
  }
  
  async shouldCreateSnapshot(
    aggregateId: string,
    currentVersion: number,
    configuration: SnapshotConfiguration
  ): Promise<Result<boolean>> {
    try {
      const lastVersion = this.lastSnapshotVersions.get(aggregateId) || 0;
      const lastTime = this.lastSnapshotTimes.get(aggregateId) || new Date(0);
      
      switch (configuration.strategy) {
        case SnapshotStrategy.EVENT_COUNT:
          const eventCountThreshold = configuration.eventCountThreshold || 100;
          return Result.withSuccess(currentVersion - lastVersion >= eventCountThreshold);
          
        case SnapshotStrategy.TIME_THRESHOLD:
          const timeThreshold = configuration.timeThreshold || 3600000; // 1 hour
          return Result.withSuccess(Date.now() - lastTime.getTime() >= timeThreshold);
          
        case SnapshotStrategy.INTERVAL:
          const interval = configuration.interval || 3600000; // 1 hour
          return Result.withSuccess(Date.now() - lastTime.getTime() >= interval);
          
        case SnapshotStrategy.MANUAL:
          return Result.withSuccess(false);
          
        case SnapshotStrategy.STATE_CHANGE:
          // This would require more complex logic to detect state changes
          return Result.withSuccess(currentVersion - lastVersion >= 1);
          
        default:
          return Result.withSuccess(false);
      }
    } catch (error) {
      return Result.withFailure(error as Error);
    }
  }
  
  async cleanupSnapshots(
    aggregateId: string,
    configuration: SnapshotConfiguration
  ): Promise<Result<void>> {
    try {
      const maxSnapshots = configuration.maxSnapshots || 10;
      
      const cleanupResult = await this.snapshotStore.deleteOldSnapshots(aggregateId, maxSnapshots);
      if (cleanupResult.isFailure) {
        return Result.withFailure(cleanupResult.error);
      }
      
      return Result.withSuccess();
    } catch (error) {
      return Result.withFailure(error as Error);
    }
  }
  
  async getSnapshotConfiguration(aggregateType: string): Promise<Result<SnapshotConfiguration>> {
    const configuration = this.configurations.get(aggregateType);
    if (!configuration) {
      return Result.withFailure(new Error(`No snapshot configuration found for aggregate type ${aggregateType}`));
    }
    
    return Result.withSuccess(configuration);
  }
  
  async setSnapshotConfiguration(
    aggregateType: string,
    configuration: SnapshotConfiguration
  ): Promise<Result<void>> {
    try {
      this.configurations.set(aggregateType, configuration);
      return Result.withSuccess();
    } catch (error) {
      return Result.withFailure(error as Error);
    }
  }
  
  private async deserializeSnapshot(snapshot: Snapshot): Promise<Result<Record<string, unknown>>> {
    try {
      let data = snapshot.data.serializedData as string;
      
      // Decrypt if encrypted
      if (this.encryptor && snapshot.metadata.customData?.encrypted) {
        const decryptionResult = await this.encryptor.decrypt(data);
        if (decryptionResult.isFailure) {
          return Result.withFailure(decryptionResult.error);
        }
        data = decryptionResult.data;
      }
      
      // Decompress if compressed
      if (this.compressor && snapshot.metadata.customData?.compressed) {
        const decompressionResult = await this.compressor.decompress(data);
        if (decompressionResult.isFailure) {
          return Result.withFailure(decompressionResult.error);
        }
        data = decompressionResult.data;
      }
      
      // Deserialize
      if (this.serializer) {
        const deserializationResult = await this.serializer.deserialize(data);
        if (deserializationResult.isFailure) {
          return Result.withFailure(deserializationResult.error);
        }
        return Result.withSuccess(deserializationResult.data);
      } else {
        return Result.withSuccess(JSON.parse(data));
      }
    } catch (error) {
      return Result.withFailure(error as Error);
    }
  }
  
  private async applyEventToState(
    state: Record<string, unknown>,
    event: DomainEvent
  ): Promise<Record<string, unknown>> {
    // This is a simplified implementation
    // In a real scenario, this would use event handlers to apply events to state
    return {
      ...state,
      lastEventId: event.id,
      lastEventType: event.type,
      lastEventTimestamp: event.timestamp
    };
  }
  
  private calculateChecksum(data: string): string {
    // Simple checksum calculation (in real implementation, use crypto.createHash)
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }
  
  private generateSnapshotId(): string {
    return `snapshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private setDefaultConfigurations(): void {
    // Set default configuration for all aggregate types
    const defaultConfig: SnapshotConfiguration = {
      strategy: SnapshotStrategy.EVENT_COUNT,
      eventCountThreshold: 100,
      compress: true,
      compressionAlgorithm: CompressionAlgorithm.GZIP,
      encrypt: false,
      maxSnapshots: 10,
      autoCleanup: true
    };
    
    this.configurations.set('*', defaultConfig);
  }
}

/**
 * Snapshot Serializer - interface for serializing/deserializing snapshots
 */
export interface SnapshotSerializer {
  serialize(data: Record<string, unknown>): Promise<Result<string>>;
  deserialize(serializedData: string): Promise<Result<Record<string, unknown>>>;
}

/**
 * Snapshot Compressor - interface for compressing/decompressing snapshots
 */
export interface SnapshotCompressor {
  compress(data: string, algorithm?: CompressionAlgorithm): Promise<Result<{
    compressedData: string;
    compressionRatio: number;
  }>>;
  decompress(compressedData: string): Promise<Result<string>>;
}

/**
 * Snapshot Encryptor - interface for encrypting/decrypting snapshots
 */
export interface SnapshotEncryptor {
  encrypt(data: string, algorithm?: EncryptionAlgorithm): Promise<Result<string>>;
  decrypt(encryptedData: string): Promise<Result<string>>;
}

/**
 * Snapshot Configuration Builder - fluent API for creating snapshot configurations
 */
export class SnapshotConfigurationBuilder {
  private configuration: Partial<SnapshotConfiguration> = {};
  
  constructor(private aggregateType: string) {}
  
  strategy(strategy: SnapshotStrategy): SnapshotConfigurationBuilder {
    this.configuration.strategy = strategy;
    return this;
  }
  
  eventCountThreshold(threshold: number): SnapshotConfigurationBuilder {
    this.configuration.eventCountThreshold = threshold;
    return this;
  }
  
  timeThreshold(threshold: number): SnapshotConfigurationBuilder {
    this.configuration.timeThreshold = threshold;
    return this;
  }
  
  interval(interval: number): SnapshotConfigurationBuilder {
    this.configuration.interval = interval;
    return this;
  }
  
  compress(compress: boolean = true): SnapshotConfigurationBuilder {
    this.configuration.compress = compress;
    return this;
  }
  
  compressionAlgorithm(algorithm: CompressionAlgorithm): SnapshotConfigurationBuilder {
    this.configuration.compressionAlgorithm = algorithm;
    return this;
  }
  
  encrypt(encrypt: boolean = true): SnapshotConfigurationBuilder {
    this.configuration.encrypt = encrypt;
    return this;
  }
  
  encryptionAlgorithm(algorithm: EncryptionAlgorithm): SnapshotConfigurationBuilder {
    this.configuration.encryptionAlgorithm = algorithm;
    return this;
  }
  
  maxSnapshots(maxSnapshots: number): SnapshotConfigurationBuilder {
    this.configuration.maxSnapshots = maxSnapshots;
    return this;
  }
  
  autoCleanup(autoCleanup: boolean = true): SnapshotConfigurationBuilder {
    this.configuration.autoCleanup = autoCleanup;
    return this;
  }
  
  build(): SnapshotConfiguration {
    if (!this.configuration.strategy) {
      throw new Error('Strategy is required');
    }
    
    return this.configuration as SnapshotConfiguration;
  }
}

/**
 * Helper function to create snapshot configuration builder
 */
export function createSnapshotConfiguration(aggregateType: string): SnapshotConfigurationBuilder {
  return new SnapshotConfigurationBuilder(aggregateType);
}
