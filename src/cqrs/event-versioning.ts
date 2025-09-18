import { Result } from "../common/result";
import { DomainEvent } from "../domain/domain-event";

/**
 * Event Version Schema - defines the structure of an event version
 */
export interface EventVersionSchema {
  /**
   * Version number
   */
  readonly version: number;
  
  /**
   * Event type this schema applies to
   */
  readonly eventType: string;
  
  /**
   * Schema definition (JSON Schema format)
   */
  readonly schema: Record<string, unknown>;
  
  /**
   * Migration function to upgrade from previous version
   */
  readonly migration?: EventMigrationFunction;
  
  /**
   * Whether this version is deprecated
   */
  readonly deprecated?: boolean;
  
  /**
   * Deprecation date
   */
  readonly deprecatedAt?: Date;
  
  /**
   * Migration deadline (when old version will be removed)
   */
  readonly migrationDeadline?: Date;
}

/**
 * Event Migration Function - migrates event data from one version to another
 */
export type EventMigrationFunction = (
  eventData: Record<string, unknown>,
  fromVersion: number,
  toVersion: number
) => Record<string, unknown>;

/**
 * Versioned Event - extends DomainEvent with version information
 */
export interface VersionedEvent<TData = Record<string, unknown>> extends DomainEvent<TData> {
  /**
   * Event schema version
   */
  readonly eventVersion: number;
  
  /**
   * Original event version (for migration tracking)
   */
  readonly originalVersion?: number;
  
  /**
   * Migration history
   */
  readonly migrationHistory?: EventMigration[];
}

/**
 * Event Migration record
 */
export interface EventMigration {
  /**
   * From version
   */
  readonly fromVersion: number;
  
  /**
   * To version
   */
  readonly toVersion: number;
  
  /**
   * Migration timestamp
   */
  readonly migratedAt: Date;
  
  /**
   * Migration function used
   */
  readonly migrationFunction?: string;
}

/**
 * Event Version Manager - manages event versions and migrations
 */
export interface EventVersionManager {
  /**
   * Register a new event version schema
   */
  registerVersion(schema: EventVersionSchema): Promise<Result<void>>;
  
  /**
   * Get version schema for event type
   */
  getVersionSchema(eventType: string, version: number): Promise<Result<EventVersionSchema>>;
  
  /**
   * Get latest version for event type
   */
  getLatestVersion(eventType: string): Promise<Result<number>>;
  
  /**
   * Get all versions for event type
   */
  getVersions(eventType: string): Promise<Result<EventVersionSchema[]>>;
  
  /**
   * Migrate event to specific version
   */
  migrateEvent(
    event: DomainEvent,
    targetVersion: number
  ): Promise<Result<VersionedEvent>>;
  
  /**
   * Migrate event to latest version
   */
  migrateToLatest(event: DomainEvent): Promise<Result<VersionedEvent>>;
  
  /**
   * Validate event against version schema
   */
  validateEvent(event: DomainEvent, version: number): Promise<Result<boolean>>;
  
  /**
   * Get migration path between versions
   */
  getMigrationPath(
    eventType: string,
    fromVersion: number,
    toVersion: number
  ): Promise<Result<EventVersionSchema[]>>;
  
  /**
   * Deprecate a version
   */
  deprecateVersion(
    eventType: string,
    version: number,
    migrationDeadline?: Date
  ): Promise<Result<void>>;
}

/**
 * Event Version Registry - stores and manages event version schemas
 */
export interface EventVersionRegistry {
  /**
   * Register version schema
   */
  register(schema: EventVersionSchema): Promise<Result<void>>;
  
  /**
   * Get version schema
   */
  get(eventType: string, version: number): Promise<Result<EventVersionSchema>>;
  
  /**
   * Get all versions for event type
   */
  getVersions(eventType: string): Promise<Result<EventVersionSchema[]>>;
  
  /**
   * Get latest version
   */
  getLatest(eventType: string): Promise<Result<EventVersionSchema>>;
  
  /**
   * Check if version exists
   */
  hasVersion(eventType: string, version: number): Promise<boolean>;
  
  /**
   * Get all registered event types
   */
  getEventTypes(): Promise<string[]>;
}

/**
 * In-memory implementation of Event Version Registry
 */
export class InMemoryEventVersionRegistry implements EventVersionRegistry {
  private schemas = new Map<string, Map<number, EventVersionSchema>>();
  
  async register(schema: EventVersionSchema): Promise<Result<void>> {
    try {
      if (!this.schemas.has(schema.eventType)) {
        this.schemas.set(schema.eventType, new Map());
      }
      
      const versions = this.schemas.get(schema.eventType)!;
      versions.set(schema.version, schema);
      
      return Result.withSuccess();
    } catch (error) {
      return Result.withFailure(error as Error);
    }
  }
  
  async get(eventType: string, version: number): Promise<Result<EventVersionSchema>> {
    const versions = this.schemas.get(eventType);
    if (!versions) {
      return Result.withFailure(new Error(`Event type ${eventType} not found`));
    }
    
    const schema = versions.get(version);
    if (!schema) {
      return Result.withFailure(new Error(`Version ${version} not found for event type ${eventType}`));
    }
    
    return Result.withSuccess(schema);
  }
  
  async getVersions(eventType: string): Promise<Result<EventVersionSchema[]>> {
    const versions = this.schemas.get(eventType);
    if (!versions) {
      return Result.withFailure(new Error(`Event type ${eventType} not found`));
    }
    
    return Result.withSuccess(Array.from(versions.values()));
  }
  
  async getLatest(eventType: string): Promise<Result<EventVersionSchema>> {
    const versions = this.schemas.get(eventType);
    if (!versions) {
      return Result.withFailure(new Error(`Event type ${eventType} not found`));
    }
    
    const latestVersion = Math.max(...versions.keys());
    const schema = versions.get(latestVersion);
    
    if (!schema) {
      return Result.withFailure(new Error(`No versions found for event type ${eventType}`));
    }
    
    return Result.withSuccess(schema);
  }
  
  async hasVersion(eventType: string, version: number): Promise<boolean> {
    const versions = this.schemas.get(eventType);
    return versions ? versions.has(version) : false;
  }
  
  async getEventTypes(): Promise<string[]> {
    return Array.from(this.schemas.keys());
  }
}

/**
 * Base implementation of Event Version Manager
 */
export class BaseEventVersionManager implements EventVersionManager {
  constructor(private registry: EventVersionRegistry) {}
  
  async registerVersion(schema: EventVersionSchema): Promise<Result<void>> {
    return this.registry.register(schema);
  }
  
  async getVersionSchema(eventType: string, version: number): Promise<Result<EventVersionSchema>> {
    return this.registry.get(eventType, version);
  }
  
  async getLatestVersion(eventType: string): Promise<Result<number>> {
    const result = await this.registry.getLatest(eventType);
    if (result.isFailure) return result;
    
    return Result.withSuccess(result.data.version);
  }
  
  async getVersions(eventType: string): Promise<Result<EventVersionSchema[]>> {
    return this.registry.getVersions(eventType);
  }
  
  async migrateEvent(
    event: DomainEvent,
    targetVersion: number
  ): Promise<Result<VersionedEvent>> {
    try {
      const currentVersion = (event as VersionedEvent).eventVersion || 1;
      
      if (currentVersion === targetVersion) {
        return Result.withSuccess(event as VersionedEvent);
      }
      
      // Get migration path
      const pathResult = await this.getMigrationPath(event.type, currentVersion, targetVersion);
      if (pathResult.isFailure) {
        return Result.withFailure(pathResult.error);
      }
      
      const migrationPath = pathResult.data;
      let migratedData = { ...event.data };
      const migrationHistory: EventMigration[] = [];
      
      // Apply migrations in sequence
      for (const schema of migrationPath) {
        if (schema.migration) {
          migratedData = schema.migration(
            migratedData,
            currentVersion,
            schema.version
          );
          
          migrationHistory.push({
            fromVersion: currentVersion,
            toVersion: schema.version,
            migratedAt: new Date(),
            migrationFunction: schema.migration.name || 'anonymous'
          });
        }
      }
      
      // Create versioned event
      const versionedEvent: VersionedEvent = {
        ...event,
        data: migratedData,
        eventVersion: targetVersion,
        originalVersion: currentVersion,
        migrationHistory
      };
      
      return Result.withSuccess(versionedEvent);
    } catch (error) {
      return Result.withFailure(error as Error);
    }
  }
  
  async migrateToLatest(event: DomainEvent): Promise<Result<VersionedEvent>> {
    const latestVersionResult = await this.getLatestVersion(event.type);
    if (latestVersionResult.isFailure) {
      return Result.withFailure(latestVersionResult.error);
    }
    
    return this.migrateEvent(event, latestVersionResult.data);
  }
  
  async validateEvent(event: DomainEvent, version: number): Promise<Result<boolean>> {
    try {
      const schemaResult = await this.getVersionSchema(event.type, version);
      if (schemaResult.isFailure) {
        return Result.withFailure(schemaResult.error);
      }
      
      const schema = schemaResult.data;
      
      // Basic validation - in real implementation, use JSON Schema validator
      // This is a simplified version
      const isValid = this.validateAgainstSchema(event.data, schema.schema);
      
      return Result.withSuccess(isValid);
    } catch (error) {
      return Result.withFailure(error as Error);
    }
  }
  
  async getMigrationPath(
    eventType: string,
    fromVersion: number,
    toVersion: number
  ): Promise<Result<EventVersionSchema[]>> {
    try {
      const versionsResult = await this.getVersions(eventType);
      if (versionsResult.isFailure) {
        return Result.withFailure(versionsResult.error);
      }
      
      const versions = versionsResult.data;
      
      // Sort versions by version number
      versions.sort((a, b) => a.version - b.version);
      
      // Find path from fromVersion to toVersion
      const path: EventVersionSchema[] = [];
      
      if (fromVersion < toVersion) {
        // Forward migration
        for (const version of versions) {
          if (version.version > fromVersion && version.version <= toVersion) {
            path.push(version);
          }
        }
      } else {
        // Backward migration (not typically supported, but included for completeness)
        for (const version of versions.reverse()) {
          if (version.version < fromVersion && version.version >= toVersion) {
            path.push(version);
          }
        }
      }
      
      return Result.withSuccess(path);
    } catch (error) {
      return Result.withFailure(error as Error);
    }
  }
  
  async deprecateVersion(
    eventType: string,
    version: number,
    migrationDeadline?: Date
  ): Promise<Result<void>> {
    try {
      const schemaResult = await this.getVersionSchema(eventType, version);
      if (schemaResult.isFailure) {
        return Result.withFailure(schemaResult.error);
      }
      
      const schema = schemaResult.data;
      const deprecatedSchema: EventVersionSchema = {
        ...schema,
        deprecated: true,
        deprecatedAt: new Date(),
        migrationDeadline
      };
      
      return this.registry.register(deprecatedSchema);
    } catch (error) {
      return Result.withFailure(error as Error);
    }
  }
  
  private validateAgainstSchema(data: unknown, schema: Record<string, unknown>): boolean {
    // Simplified validation - in real implementation, use a proper JSON Schema validator
    // like ajv or jsonschema
    try {
      // Basic type checking
      if (schema.type && typeof data !== schema.type) {
        return false;
      }
      
      // Required fields checking
      if (schema.required && Array.isArray(schema.required)) {
        for (const field of schema.required) {
          if (!(data as Record<string, unknown>)[field as string]) {
            return false;
          }
        }
      }
      
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Event Version Builder - fluent API for creating event version schemas
 */
export class EventVersionBuilder {
  private schema: Partial<EventVersionSchema> = {};
  
  constructor(private eventType: string) {}
  
  version(version: number): EventVersionBuilder {
    this.schema.version = version;
    return this;
  }
  
  schema(schema: Record<string, unknown>): EventVersionBuilder {
    this.schema.schema = schema;
    return this;
  }
  
  migration(migration: EventMigrationFunction): EventVersionBuilder {
    this.schema.migration = migration;
    return this;
  }
  
  deprecated(deprecated: boolean = true): EventVersionBuilder {
    this.schema.deprecated = deprecated;
    return this;
  }
  
  migrationDeadline(deadline: Date): EventVersionBuilder {
    this.schema.migrationDeadline = deadline;
    return this;
  }
  
  build(): EventVersionSchema {
    if (!this.schema.version) {
      throw new Error('Version is required');
    }
    
    if (!this.schema.schema) {
      throw new Error('Schema is required');
    }
    
    return {
      eventType: this.eventType,
      version: this.schema.version,
      schema: this.schema.schema,
      migration: this.schema.migration,
      deprecated: this.schema.deprecated,
      deprecatedAt: this.schema.deprecated ? new Date() : undefined,
      migrationDeadline: this.schema.migrationDeadline
    } as EventVersionSchema;
  }
}

/**
 * Helper function to create event version builder
 */
export function createEventVersion(eventType: string): EventVersionBuilder {
  return new EventVersionBuilder(eventType);
}
