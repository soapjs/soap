/* eslint-disable @typescript-eslint/no-explicit-any */
import { Source } from "./source";
import { Mapper } from "./mapper";
import { DatabaseSessionRegistry } from "./database-session-registry";

export interface DataContext<EntityType, ModelType> {
  /**
   * The source representing the data storage.
   * @type {Source<ModelType>}
   */
  source: Source<ModelType>;

  /**
   * The mapper used to map between entity and model types.
   * @type {Mapper<EntityType, ModelType>}
   */
  mapper: Mapper<EntityType, ModelType>;
}

/**
 * NonDatabaseSource interface that defines methods for interacting with a non-database data source.
 */
export interface NonDatabaseSource {
  /**
   * Aggregates data based on provided arguments.
   * @param {...unknown[]} args - The arguments for the aggregation operation.
   * @returns {any} The result of the aggregation operation.
   */
  aggregate(...args: unknown[]): any;

  /**
   * Inserts data based on provided arguments.
   * @param {...unknown[]} args - The arguments for the insert operation.
   * @returns {any} The result of the insert operation.
   */
  insert(...args: unknown[]): any;

  /**
   * Removes data based on provided arguments.
   * @param {...unknown[]} args - The arguments for the remove operation.
   * @returns {any} The result of the remove operation.
   */
  remove(...args: unknown[]): any;

  /**
   * Finds data based on provided arguments.
   * @param {...unknown[]} args - The arguments for the find operation.
   * @returns {any} The result of the find operation.
   */
  find(...args: unknown[]): any;

  /**
   * Updates data based on provided arguments.
   * @param {...unknown[]} args - The arguments for the update operation.
   * @returns {any} The result of the update operation.
   */
  update(...args: unknown[]): any;

  /**
   * Counts data based on provided arguments.
   * @param {...unknown[]} args - The arguments for the count operation.
   * @returns {any} The result of the count operation.
   */
  count(...args: unknown[]): any;
}

/**
 * DatabaseContext class that defines the structure for a database context used in a repository pattern.
 * @template EntityType The type of the entity.
 * @template ModelType The type of the model.
 */
export class DatabaseContext<EntityType = unknown, ModelType = unknown> {
  static isDatabaseContext(value: any): value is DatabaseContext {
    return value && value.isDatabaseContext === true;
  }

  /**
   * Indicates this is a database context.
   * @type {boolean}
   */
  public readonly isDatabaseContext: boolean = true;

  /**
   * The source representing the data storage.
   * @type {Source<ModelType>}
   */
  public source: Source<ModelType>;

  /**
   * The sessions factory.
   * @type {DatabaseSessionRegistry}
   */
  public sessions: DatabaseSessionRegistry;

  /**
   * The mapper used to map between entity and model types.
   * @type {Mapper<EntityType, ModelType>}
   */
  public mapper: Mapper<EntityType, ModelType>;

  /**
   * Constructs a DatabaseContext.
   * @param {Source<ModelType>} source - The source representing the data storage.
   * @param {Mapper<EntityType, ModelType>} [mapper] - The mapper used to map between entity and model types.
   * @param {DatabaseSessionRegistry} [sessions] - The data storage session factory.
   */
  constructor(
    source: Source<ModelType>,
    mapper: Mapper<EntityType, ModelType>,
    sessions: DatabaseSessionRegistry
  ) {
    this.source = source;
    this.mapper = mapper;
    this.sessions = sessions;
  }
}

/**
 * HttpContext class that defines the structure for an HTTP context used in a repository pattern.
 * @template EntityType The type of the entity.
 * @template ModelType The type of the model.
 */
export class HttpContext<EntityType = unknown, ModelType = unknown> {
  static isHttpContext(value: any): value is HttpContext {
    return value && value.isHttpContext === true;
  }
  /**
   * Indicates this is an HTTP context.
   * @type {boolean}
   */
  public readonly isHttpContext: boolean = true;

  /**
   * The base URL for the HTTP service.
   * @type {string}
   */
  public baseUrl: string;

  /**
   * The HTTP source used to interact with the HTTP service.
   * @type {NonDatabaseSource}
   */
  public source: NonDatabaseSource;

  /**
   * The mapper used to map between entity and model types.
   * @type {Mapper<EntityType, ModelType>}
   */
  public mapper: Mapper<EntityType, ModelType>;

  /**
   * Constructs an HttpContext.
   * @param {string} baseUrl - The base URL for the HTTP service.
   * @param {NonDatabaseSource} source - The HTTP source used to interact with the HTTP service.
   * @param {Mapper<EntityType, ModelType>} [mapper] - The mapper used to map between entity and model types.
   */
  constructor(
    baseUrl: string,
    source: NonDatabaseSource,
    mapper: Mapper<EntityType, ModelType>
  ) {
    this.baseUrl = baseUrl;
    this.source = source;
    this.mapper = mapper;
  }
}

/**
 * WebSocketContext class that defines the structure for a WebSocket context used in a repository pattern.
 * @template EntityType The type of the entity.
 * @template ModelType The type of the model.
 */
export class WebSocketContext<EntityType = unknown, ModelType = unknown> {
  static isWebSocketContext(value: any): value is WebSocketContext {
    return value && value.isWebSocketContext === true;
  }
  /**
   * Indicates this is a WebSocket context.
   * @type {boolean}
   */
  public readonly isWebSocketContext: boolean = true;

  /**
   * The WebSocket endpoint URL.
   * @type {string}
   */
  public endpoint: string;

  /**
   * The WebSocket source used to interact with the WebSocket service.
   * @type {NonDatabaseSource}
   */
  public source: NonDatabaseSource;

  /**
   * The mapper used to map between entity and model types.
   * @type {Mapper<EntityType, ModelType>}
   */
  public mapper: Mapper<EntityType, ModelType>;

  /**
   * Constructs a WebSocketContext.
   * @param {string} endpoint - The WebSocket endpoint URL.
   * @param {NonDatabaseSource} source - The WebSocket source used to interact with the WebSocket service.
   * @param {Mapper<EntityType, ModelType>} [mapper] - The mapper used to map between entity and model types.
   */
  constructor(
    endpoint: string,
    source: NonDatabaseSource,
    mapper: Mapper<EntityType, ModelType>
  ) {
    this.endpoint = endpoint;
    this.source = source;
    this.mapper = mapper;
  }
}

/**
 * BlockchainContext class that defines the structure for a blockchain context used in a repository pattern.
 * @template EntityType The type of the entity.
 * @template ModelType The type of the model.
 */
export class BlockchainContext<EntityType = unknown, ModelType = unknown> {
  static isBlockchainContext(value: any): value is BlockchainContext {
    return value && value.isBlockchainContext === true;
  }
  /**
   * Indicates this is a blockchain context.
   * @type {boolean}
   */
  public readonly isBlockchainContext: boolean = true;

  /**
   * The blockchain network identifier.
   * @type {string}
   */
  public network: string;

  /**
   * The blockchain source used to interact with the blockchain.
   * @type {NonDatabaseSource}
   */
  public source: NonDatabaseSource;

  /**
   * The mapper used to map between entity and model types.
   * @type {Mapper<EntityType, ModelType>}
   */
  public mapper: Mapper<EntityType, ModelType>;

  /**
   * Constructs a BlockchainContext.
   * @param {string} network - The blockchain network identifier.
   * @param {NonDatabaseSource} source - The blockchain source used to interact with the blockchain.
   * @param {Mapper<EntityType, ModelType>} [mapper] - The mapper used to map between entity and model types.
   */
  constructor(
    network: string,
    source: NonDatabaseSource,
    mapper: Mapper<EntityType, ModelType>
  ) {
    this.network = network;
    this.source = source;
    this.mapper = mapper;
  }
}

/**
 * AnyContext class that defines the structure for a unclassified context used in a repository pattern.
 * @template EntityType The type of the entity.
 * @template ModelType The type of the model.
 */
export class AnyContext<EntityType = unknown, ModelType = unknown> {
  static isAnyContext(value: any): value is AnyContext {
    return value && value.isAnyContext === true;
  }
  /**
   * Indicates this is a context.
   * @type {boolean}
   */
  public readonly isAnyContext: boolean = true;

  /**
   * The source used to interact with the data source.
   * @type {NonDatabaseSource}
   */
  public source: NonDatabaseSource;

  /**
   * The mapper used to map between entity and model types.
   * @type {Mapper<EntityType, ModelType>}
   */
  public mapper: Mapper<EntityType, ModelType>;

  /**
   * Constructs a AnyContext.
   * @param {NonDatabaseSource} source - The source used to interact with the data source.
   * @param {Mapper<EntityType, ModelType>} [mapper] - The mapper used to map between entity and model types.
   */
  constructor(
    source: NonDatabaseSource,
    mapper: Mapper<EntityType, ModelType>
  ) {
    this.source = source;
    this.mapper = mapper;
  }
}
