import { Result } from "../common/result";
import { DomainEvent } from "../domain/domain-event";

/**
 * Event Correlation Type - defines the type of correlation between events
 */
export enum CorrelationType {
  /**
   * Causal correlation (event A causes event B)
   */
  CAUSAL = 'causal',
  
  /**
   * Temporal correlation (events happen in sequence)
   */
  TEMPORAL = 'temporal',
  
  /**
   * Contextual correlation (events share same context)
   */
  CONTEXTUAL = 'contextual',
  
  /**
   * Data correlation (events share same data)
   */
  DATA = 'data',
  
  /**
   * Business correlation (events related by business process)
   */
  BUSINESS = 'business'
}

/**
 * Event Correlation - represents a correlation between two events
 */
export interface EventCorrelation {
  /**
   * Unique correlation ID
   */
  readonly correlationId: string;
  
  /**
   * Source event ID
   */
  readonly sourceEventId: string;
  
  /**
   * Target event ID
   */
  readonly targetEventId: string;
  
  /**
   * Correlation type
   */
  readonly correlationType: CorrelationType;
  
  /**
   * Correlation strength (0-1)
   */
  readonly strength: number;
  
  /**
   * Correlation metadata
   */
  readonly metadata: CorrelationMetadata;
  
  /**
   * Created timestamp
   */
  readonly createdAt: Date;
  
  /**
   * Whether this correlation is active
   */
  readonly active: boolean;
}

/**
 * Correlation Metadata
 */
export interface CorrelationMetadata {
  /**
   * Business process ID
   */
  readonly businessProcessId?: string;
  
  /**
   * User ID
   */
  readonly userId?: string;
  
  /**
   * Session ID
   */
  readonly sessionId?: string;
  
  /**
   * Request ID
   */
  readonly requestId?: string;
  
  /**
   * Transaction ID
   */
  readonly transactionId?: string;
  
  /**
   * Custom correlation data
   */
  readonly customData?: Record<string, unknown>;
}

/**
 * Event Correlation Rule - defines how events should be correlated
 */
export interface EventCorrelationRule {
  /**
   * Rule ID
   */
  readonly ruleId: string;
  
  /**
   * Rule name
   */
  readonly name: string;
  
  /**
   * Rule description
   */
  readonly description?: string;
  
  /**
   * Source event type pattern
   */
  readonly sourceEventPattern: EventPattern;
  
  /**
   * Target event type pattern
   */
  readonly targetEventPattern: EventPattern;
  
  /**
   * Correlation type
   */
  readonly correlationType: CorrelationType;
  
  /**
   * Correlation conditions
   */
  readonly conditions: CorrelationCondition[];
  
  /**
   * Whether this rule is active
   */
  readonly active: boolean;
  
  /**
   * Rule priority
   */
  readonly priority: number;
}

/**
 * Event Pattern - defines patterns for matching events
 */
export interface EventPattern {
  /**
   * Event type pattern (supports wildcards)
   */
  readonly eventType: string;
  
  /**
   * Data field patterns
   */
  readonly dataPatterns?: Record<string, unknown>;
  
  /**
   * Metadata patterns
   */
  readonly metadataPatterns?: Record<string, unknown>;
  
  /**
   * Time window (in milliseconds)
   */
  readonly timeWindow?: number;
}

/**
 * Correlation Condition - defines conditions for correlation
 */
export interface CorrelationCondition {
  /**
   * Condition type
   */
  readonly type: ConditionType;
  
  /**
   * Field path (e.g., 'data.userId', 'metadata.sessionId')
   */
  readonly fieldPath: string;
  
  /**
   * Expected value
   */
  readonly expectedValue: unknown;
  
  /**
   * Comparison operator
   */
  readonly operator: ComparisonOperator;
}

/**
 * Condition Type
 */
export enum ConditionType {
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  CONTAINS = 'contains',
  STARTS_WITH = 'starts_with',
  ENDS_WITH = 'ends_with',
  REGEX = 'regex',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  EXISTS = 'exists',
  NOT_EXISTS = 'not_exists'
}

/**
 * Comparison Operator
 */
export enum ComparisonOperator {
  AND = 'and',
  OR = 'or',
  NOT = 'not'
}

/**
 * Event Correlation Context - context for correlation analysis
 */
export interface EventCorrelationContext {
  /**
   * Correlation ID
   */
  readonly correlationId: string;
  
  /**
   * Events in this correlation
   */
  readonly events: DomainEvent[];
  
  /**
   * Correlation metadata
   */
  readonly metadata: CorrelationMetadata;
  
  /**
   * Created timestamp
   */
  readonly createdAt: Date;
  
  /**
   * Last updated timestamp
   */
  readonly lastUpdated: Date;
  
  /**
   * Correlation strength
   */
  readonly strength: number;
  
  /**
   * Correlation type
   */
  readonly correlationType: CorrelationType;
}

/**
 * Event Correlation Manager - manages event correlations
 */
export interface EventCorrelationManager {
  /**
   * Register a correlation rule
   */
  registerCorrelationRule(rule: EventCorrelationRule): Promise<Result<void>>;
  
  /**
   * Process event for correlation
   */
  processEvent(event: DomainEvent): Promise<Result<EventCorrelation[]>>;
  
  /**
   * Get correlations for an event
   */
  getEventCorrelations(eventId: string): Promise<Result<EventCorrelation[]>>;
  
  /**
   * Get correlation context
   */
  getCorrelationContext(correlationId: string): Promise<Result<EventCorrelationContext>>;
  
  /**
   * Get events in correlation
   */
  getEventsInCorrelation(correlationId: string): Promise<Result<DomainEvent[]>>;
  
  /**
   * Find correlated events
   */
  findCorrelatedEvents(
    event: DomainEvent,
    correlationType?: CorrelationType
  ): Promise<Result<DomainEvent[]>>;
  
  /**
   * Get correlation statistics
   */
  getCorrelationStatistics(): Promise<Result<CorrelationStatistics>>;
  
  /**
   * Remove correlation
   */
  removeCorrelation(correlationId: string): Promise<Result<void>>;
}

/**
 * Correlation Statistics
 */
export interface CorrelationStatistics {
  /**
   * Total correlations
   */
  readonly totalCorrelations: number;
  
  /**
   * Active correlations
   */
  readonly activeCorrelations: number;
  
  /**
   * Correlations by type
   */
  readonly correlationsByType: Record<CorrelationType, number>;
  
  /**
   * Average correlation strength
   */
  readonly averageStrength: number;
  
  /**
   * Most correlated event types
   */
  readonly mostCorrelatedTypes: Array<{
    eventType: string;
    correlationCount: number;
  }>;
}

/**
 * Base implementation of Event Correlation Manager
 */
export class BaseEventCorrelationManager implements EventCorrelationManager {
  private correlationRules = new Map<string, EventCorrelationRule>();
  private correlations = new Map<string, EventCorrelation>();
  private correlationContexts = new Map<string, EventCorrelationContext>();
  private eventCorrelations = new Map<string, Set<string>>(); // eventId -> correlationIds
  private statistics: CorrelationStatistics = {
    totalCorrelations: 0,
    activeCorrelations: 0,
    correlationsByType: {
      [CorrelationType.CAUSAL]: 0,
      [CorrelationType.TEMPORAL]: 0,
      [CorrelationType.CONTEXTUAL]: 0,
      [CorrelationType.DATA]: 0,
      [CorrelationType.BUSINESS]: 0
    },
    averageStrength: 0,
    mostCorrelatedTypes: []
  };
  
  async registerCorrelationRule(rule: EventCorrelationRule): Promise<Result<void>> {
    try {
      this.correlationRules.set(rule.ruleId, rule);
      return Result.withSuccess();
    } catch (error) {
      return Result.withFailure(error as Error);
    }
  }
  
  async processEvent(event: DomainEvent): Promise<Result<EventCorrelation[]>> {
    try {
      const newCorrelations: EventCorrelation[] = [];
      
      // Check against all active rules
      for (const rule of this.correlationRules.values()) {
        if (!rule.active) continue;
        
        // Check if event matches source pattern
        if (this.matchesPattern(event, rule.sourceEventPattern)) {
          // Find target events that match the target pattern
          const targetEvents = await this.findTargetEvents(event, rule);
          
          for (const targetEvent of targetEvents) {
            // Check correlation conditions
            if (this.checkCorrelationConditions(event, targetEvent, rule.conditions)) {
              const correlation = await this.createCorrelation(event, targetEvent, rule);
              newCorrelations.push(correlation);
            }
          }
        }
        
        // Check if event matches target pattern
        if (this.matchesPattern(event, rule.targetEventPattern)) {
          // Find source events that match the source pattern
          const sourceEvents = await this.findSourceEvents(event, rule);
          
          for (const sourceEvent of sourceEvents) {
            // Check correlation conditions
            if (this.checkCorrelationConditions(sourceEvent, event, rule.conditions)) {
              const correlation = await this.createCorrelation(sourceEvent, event, rule);
              newCorrelations.push(correlation);
            }
          }
        }
      }
      
      // Store correlations
      for (const correlation of newCorrelations) {
        await this.storeCorrelation(correlation);
      }
      
      return Result.withSuccess(newCorrelations);
    } catch (error) {
      return Result.withFailure(error as Error);
    }
  }
  
  async getEventCorrelations(eventId: string): Promise<Result<EventCorrelation[]>> {
    try {
      const correlationIds = this.eventCorrelations.get(eventId) || new Set();
      const correlations: EventCorrelation[] = [];
      
      for (const correlationId of correlationIds) {
        const correlation = this.correlations.get(correlationId);
        if (correlation) {
          correlations.push(correlation);
        }
      }
      
      return Result.withSuccess(correlations);
    } catch (error) {
      return Result.withFailure(error as Error);
    }
  }
  
  async getCorrelationContext(correlationId: string): Promise<Result<EventCorrelationContext>> {
    const context = this.correlationContexts.get(correlationId);
    if (!context) {
      return Result.withFailure(new Error(`Correlation context ${correlationId} not found`));
    }
    
    return Result.withSuccess(context);
  }
  
  async getEventsInCorrelation(correlationId: string): Promise<Result<DomainEvent[]>> {
    const context = this.correlationContexts.get(correlationId);
    if (!context) {
      return Result.withFailure(new Error(`Correlation context ${correlationId} not found`));
    }
    
    return Result.withSuccess(context.events);
  }
  
  async findCorrelatedEvents(
    event: DomainEvent,
    correlationType?: CorrelationType
  ): Promise<Result<DomainEvent[]>> {
    try {
      const correlations = await this.getEventCorrelations(event.id || '');
      if (correlations.isFailure) {
        return correlations;
      }
      
      const correlatedEvents: DomainEvent[] = [];
      
      for (const correlation of correlations.data) {
        if (correlationType && correlation.correlationType !== correlationType) {
          continue;
        }
        
        const context = this.correlationContexts.get(correlation.correlationId);
        if (context) {
          correlatedEvents.push(...context.events.filter(e => e.id !== event.id));
        }
      }
      
      return Result.withSuccess(correlatedEvents);
    } catch (error) {
      return Result.withFailure(error as Error);
    }
  }
  
  async getCorrelationStatistics(): Promise<Result<CorrelationStatistics>> {
    return Result.withSuccess({ ...this.statistics });
  }
  
  async removeCorrelation(correlationId: string): Promise<Result<void>> {
    try {
      const correlation = this.correlations.get(correlationId);
      if (!correlation) {
        return Result.withFailure(new Error(`Correlation ${correlationId} not found`));
      }
      
      // Remove from correlations map
      this.correlations.delete(correlationId);
      
      // Remove from correlation contexts
      this.correlationContexts.delete(correlationId);
      
      // Remove from event correlations
      this.eventCorrelations.get(correlation.sourceEventId)?.delete(correlationId);
      this.eventCorrelations.get(correlation.targetEventId)?.delete(correlationId);
      
      // Update statistics
      this.statistics.totalCorrelations--;
      this.statistics.activeCorrelations--;
      this.statistics.correlationsByType[correlation.correlationType]--;
      
      return Result.withSuccess();
    } catch (error) {
      return Result.withFailure(error as Error);
    }
  }
  
  private matchesPattern(event: DomainEvent, pattern: EventPattern): boolean {
    // Check event type
    if (!this.matchesEventType(event.type, pattern.eventType)) {
      return false;
    }
    
    // Check data patterns
    if (pattern.dataPatterns) {
      for (const [key, expectedValue] of Object.entries(pattern.dataPatterns)) {
        const actualValue = this.getNestedValue(event.data, key);
        if (actualValue !== expectedValue) {
          return false;
        }
      }
    }
    
    // Check metadata patterns
    if (pattern.metadataPatterns) {
      for (const [key, expectedValue] of Object.entries(pattern.metadataPatterns)) {
        const actualValue = this.getNestedValue(event, key);
        if (actualValue !== expectedValue) {
          return false;
        }
      }
    }
    
    return true;
  }
  
  private matchesEventType(eventType: string, pattern: string): boolean {
    // Simple wildcard matching (supports * and ?)
    if (pattern.includes('*') || pattern.includes('?')) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*').replace(/\?/g, '.'));
      return regex.test(eventType);
    }
    
    return eventType === pattern;
  }
  
  private checkCorrelationConditions(
    sourceEvent: DomainEvent,
    targetEvent: DomainEvent,
    conditions: CorrelationCondition[]
  ): boolean {
    for (const condition of conditions) {
      const sourceValue = this.getNestedValue(sourceEvent, condition.fieldPath);
      const targetValue = this.getNestedValue(targetEvent, condition.fieldPath);
      
      if (!this.evaluateCondition(sourceValue, targetValue, condition)) {
        return false;
      }
    }
    
    return true;
  }
  
  private evaluateCondition(
    sourceValue: unknown,
    targetValue: unknown,
    condition: CorrelationCondition
  ): boolean {
    switch (condition.type) {
      case ConditionType.EQUALS:
        return sourceValue === condition.expectedValue && targetValue === condition.expectedValue;
        
      case ConditionType.NOT_EQUALS:
        return sourceValue !== condition.expectedValue && targetValue !== condition.expectedValue;
        
      case ConditionType.CONTAINS:
        return this.containsValue(sourceValue, condition.expectedValue) &&
               this.containsValue(targetValue, condition.expectedValue);
        
      case ConditionType.EXISTS:
        return sourceValue !== undefined && targetValue !== undefined;
        
      case ConditionType.NOT_EXISTS:
        return sourceValue === undefined && targetValue === undefined;
        
      default:
        return false;
    }
  }
  
  private containsValue(value: unknown, expectedValue: unknown): boolean {
    if (typeof value === 'string' && typeof expectedValue === 'string') {
      return value.includes(expectedValue);
    }
    
    if (Array.isArray(value)) {
      return value.includes(expectedValue);
    }
    
    return false;
  }
  
  private async findTargetEvents(
    sourceEvent: DomainEvent,
    rule: EventCorrelationRule
  ): Promise<DomainEvent[]> {
    // In a real implementation, this would query the event store
    // For now, return empty array
    return [];
  }
  
  private async findSourceEvents(
    targetEvent: DomainEvent,
    rule: EventCorrelationRule
  ): Promise<DomainEvent[]> {
    // In a real implementation, this would query the event store
    // For now, return empty array
    return [];
  }
  
  private async createCorrelation(
    sourceEvent: DomainEvent,
    targetEvent: DomainEvent,
    rule: EventCorrelationRule
  ): Promise<EventCorrelation> {
    const correlationId = this.generateCorrelationId();
    
    return {
      correlationId,
      sourceEventId: sourceEvent.id || '',
      targetEventId: targetEvent.id || '',
      correlationType: rule.correlationType,
      strength: this.calculateCorrelationStrength(sourceEvent, targetEvent, rule),
      metadata: this.extractCorrelationMetadata(sourceEvent, targetEvent),
      createdAt: new Date(),
      active: true
    };
  }
  
  private calculateCorrelationStrength(
    sourceEvent: DomainEvent,
    targetEvent: DomainEvent,
    rule: EventCorrelationRule
  ): number {
    // Simple strength calculation based on matching conditions
    let strength = 0.5; // Base strength
    
    // Increase strength based on matching conditions
    for (const condition of rule.conditions) {
      const sourceValue = this.getNestedValue(sourceEvent, condition.fieldPath);
      const targetValue = this.getNestedValue(targetEvent, condition.fieldPath);
      
      if (sourceValue === targetValue) {
        strength += 0.1;
      }
    }
    
    return Math.min(strength, 1.0);
  }
  
  private extractCorrelationMetadata(
    sourceEvent: DomainEvent,
    targetEvent: DomainEvent
  ): CorrelationMetadata {
    // Extract common metadata from events
    const metadata: CorrelationMetadata = {};
    
    // Extract from source event
    if (sourceEvent.data) {
      metadata.userId = sourceEvent.data.userId as string;
      metadata.sessionId = sourceEvent.data.sessionId as string;
      metadata.requestId = sourceEvent.data.requestId as string;
      metadata.transactionId = sourceEvent.data.transactionId as string;
    }
    
    return metadata;
  }
  
  private async storeCorrelation(correlation: EventCorrelation): Promise<void> {
    // Store correlation
    this.correlations.set(correlation.correlationId, correlation);
    
    // Update event correlations mapping
    if (!this.eventCorrelations.has(correlation.sourceEventId)) {
      this.eventCorrelations.set(correlation.sourceEventId, new Set());
    }
    if (!this.eventCorrelations.has(correlation.targetEventId)) {
      this.eventCorrelations.set(correlation.targetEventId, new Set());
    }
    
    this.eventCorrelations.get(correlation.sourceEventId)!.add(correlation.correlationId);
    this.eventCorrelations.get(correlation.targetEventId)!.add(correlation.correlationId);
    
    // Create or update correlation context
    await this.updateCorrelationContext(correlation);
    
    // Update statistics
    this.statistics.totalCorrelations++;
    this.statistics.activeCorrelations++;
    this.statistics.correlationsByType[correlation.correlationType]++;
  }
  
  private async updateCorrelationContext(correlation: EventCorrelation): Promise<void> {
    const existingContext = this.correlationContexts.get(correlation.correlationId);
    
    if (existingContext) {
      // Update existing context
      existingContext.lastUpdated = new Date();
      existingContext.strength = correlation.strength;
    } else {
      // Create new context
      const context: EventCorrelationContext = {
        correlationId: correlation.correlationId,
        events: [], // Would be populated with actual events
        metadata: correlation.metadata,
        createdAt: correlation.createdAt,
        lastUpdated: new Date(),
        strength: correlation.strength,
        correlationType: correlation.correlationType
      };
      
      this.correlationContexts.set(correlation.correlationId, context);
    }
  }
  
  private getNestedValue(obj: unknown, path: string): unknown {
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = (current as Record<string, unknown>)[key];
      } else {
        return undefined;
      }
    }
    
    return current;
  }
  
  private generateCorrelationId(): string {
    return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Event Correlation Rule Builder - fluent API for creating correlation rules
 */
export class EventCorrelationRuleBuilder {
  private rule: Partial<EventCorrelationRule> = {
    conditions: [],
    active: true,
    priority: 0
  };
  
  constructor(private ruleId: string, private name: string) {
    this.rule.ruleId = ruleId;
    this.rule.name = name;
  }
  
  description(description: string): EventCorrelationRuleBuilder {
    this.rule.description = description;
    return this;
  }
  
  sourceEventPattern(pattern: EventPattern): EventCorrelationRuleBuilder {
    this.rule.sourceEventPattern = pattern;
    return this;
  }
  
  targetEventPattern(pattern: EventPattern): EventCorrelationRuleBuilder {
    this.rule.targetEventPattern = pattern;
    return this;
  }
  
  correlationType(type: CorrelationType): EventCorrelationRuleBuilder {
    this.rule.correlationType = type;
    return this;
  }
  
  addCondition(condition: CorrelationCondition): EventCorrelationRuleBuilder {
    this.rule.conditions!.push(condition);
    return this;
  }
  
  active(active: boolean): EventCorrelationRuleBuilder {
    this.rule.active = active;
    return this;
  }
  
  priority(priority: number): EventCorrelationRuleBuilder {
    this.rule.priority = priority;
    return this;
  }
  
  build(): EventCorrelationRule {
    if (!this.rule.sourceEventPattern) {
      throw new Error('Source event pattern is required');
    }
    
    if (!this.rule.targetEventPattern) {
      throw new Error('Target event pattern is required');
    }
    
    if (!this.rule.correlationType) {
      throw new Error('Correlation type is required');
    }
    
    return this.rule as EventCorrelationRule;
  }
}

/**
 * Helper function to create correlation rule builder
 */
export function createCorrelationRule(ruleId: string, name: string): EventCorrelationRuleBuilder {
  return new EventCorrelationRuleBuilder(ruleId, name);
}
