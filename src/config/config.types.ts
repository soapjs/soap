/* eslint-disable @typescript-eslint/no-explicit-any */

import { AnyFunction } from "../api";
import { AnyObject } from "../architecture";

/**
 * Represents options for session middleware.
 *
 * @typedef {Object} SessionConfig
 * @property {string} secret - Secret key for signing the session ID cookie.
 * @property {boolean} [resave] - Forces the session to be saved back to the session store, even if it was never modified during the request.
 * @property {boolean} [saveUninitialized] - Forces a session that is "uninitialized" to be saved to the store.
 * @property {Object.<string, any>} [cookie] - Session cookie options.
 * @property {Object.<string, any>} [key] - Additional properties.
 */
export type SessionConfig = {
  secret: string;
  resave?: boolean;
  saveUninitialized?: boolean;
  cookie?: {
    maxAge?: number;
    secure?: boolean;
    [key: string]: any;
  };
  [key: string]: any;
};

/**
 * JWT authentication configuration.
 *
 * @typedef {Object} JwtConfig
 * @property {string} secret - Secret key used for signing the JWT.
 * @property {string} [issuer] - Issuer of the JWT.
 * @property {string} [audience] - Audience of the JWT.
 * @property {number} [expiresIn] - Expiration time of the JWT in seconds.
 * @property {boolean} [session] - Specifies whether to use session options.
 * @property {string} [jwtFromRequest]
 * @property {Promise<any>} [validate] - Validation function.
 * @property {Object.<string, any>} [key: string] - Additional properties.
 */
export type JwtConfig = {
  secretOrKey: string;
  issuer?: string;
  audience?: string;
  expiresIn?: number;
  session?: boolean;
  jwtFromRequest?: any;
  validate: (...args: unknown[]) => Promise<any>;
  [key: string]: any;
};

/**
 * OAuth authentication configuration.
 *
 * @typedef {Object} OAuthConfig
 * @property {string} clientID - OAuth client ID.
 * @property {string} clientSecret - OAuth client secret.
 * @property {string} callbackURL - OAuth callback URL.
 * @property {string} redirectPath - OAuth redirect path.
 * @property {string} authPath - OAuth auth path.
 * @property {string} callbackPath - OAuth callback path.
 * @property {string} [authHttpMethod] - OAuth auth http method.
 * @property {string} [scope] - OAuth scopes.
 * @property {string} [failurePath] - OAuth failure callback path.
 * @property {boolean} [session] - Specifies whether to use session options.
 * @property {Promise<any>} [validate] - Validation function.
 * @property {Object.<string, any>} [key: string] - Additional properties.
 */
export type OAuthConfig = {
  clientID: string;
  clientSecret: string;
  callbackURL: string;
  redirectPath?: string;
  authPath: string;
  callbackPath: string;
  authHttpMethod?: string;
  scope?: string;
  failurePath?: string;
  session?: boolean;
  validate: (...args: unknown[]) => Promise<any>;
  [key: string]: any;
};

export type GoogleConfig = OAuthConfig & {
  validate: (
    profile: AnyObject,
    accessToken: string,
    refreshToken: string
  ) => Promise<any>;
};

export type FacebookConfig = OAuthConfig & {
  validate: (
    profile: AnyObject,
    accessToken: string,
    refreshToken: string
  ) => Promise<any>;
};

export type TwitterConfig = OAuthConfig & {
  validate: (
    token: string,
    tokenSecret: string,
    profile: AnyObject
  ) => Promise<any>;
};

/**
 * API key authentication configuration.
 *
 * @typedef {Object} ApiKeyConfig
 * @property {string} [apiKeyHeader] - API key header name.
 * @property {string} [apiKeyQueryParam] - API key query param.
 * @property {boolean} [session] - Specifies whether to use session options.
 * @property {Promise<any>} [validate] - Validation function.
 * @property {Object.<string, any>} [key: string] - Additional properties.
 */
export type ApiKeyConfig = {
  apiKeyHeader?: string;
  apiKeyQueryParam?: string;
  session?: boolean;
  validate: (apiKey: string) => Promise<any>;
  [key: string]: any;
};

/**
 * User-password authentication configuration.
 *
 * @typedef {Object} UserPasswordConfig
 * @property {string} authPath - Auth path.
 * @property {string} [authHttpMethod] - Auth http method.
 * @property {string} [failurePath] - Auth failure callback path.
 * @property {boolean} [session] - Specifies whether to use session options.
 * @property {Promise<any>} [validate] - Validation function.
 * @property {Object.<string, any>} [key: string] - Additional properties.
 */
export type UserPasswordConfig = {
  authPath: string;
  authHttpMethod?: string;
  failurePath?: string;
  session?: boolean;
  validate: (...args: unknown[]) => Promise<any>;
  [key: string]: any;
};

export type AuthSessionOptions = {
  serialize?: (data: any, callback: AnyFunction) => void | Promise<void>;
  deserialize?: (data: any, callback: AnyFunction) => void | Promise<void>;
  [key: string]: any;
};

/**
 * API authentication configuration.
 *
 * @typedef {Object} ApiAuthConfig
 * @property {JwtConfig} [jwt] - Configuration for JWT authentication.
 * @property {OAuthConfig} [facebook] - Configuration for Facebook OAuth authentication.
 * @property {OAuthConfig} [google] - Configuration for Google OAuth authentication.
 * @property {OAuthConfig} [twitter] - Configuration for Twitter OAuth authentication.
 * @property {ApiKeyConfig} [apiKey] - Configuration for API key authentication.
 * @property {UserPasswordConfig} [local] - Configuration for local (user-password) authentication.
 * @property {UserPasswordConfig} [basic] - Configuration for basic (user-password) authentication.
 * @property {AuthSessionOptions} [sessionOptions] - Additional options for auth session.
 * @property {Object.<string, any>} [key: string] - Additional properties.
 */
export type ApiAuthConfig = {
  jwt?: JwtConfig;
  facebook?: OAuthConfig;
  google?: OAuthConfig;
  twitter?: OAuthConfig;
  apiKey?: ApiKeyConfig;
  local?: UserPasswordConfig;
  basic?: UserPasswordConfig;
  sessionOptions?: AuthSessionOptions;
  [key: string]: any;
};

export type AnyAuthConfig =
  | JwtConfig
  | OAuthConfig
  | ApiKeyConfig
  | UserPasswordConfig
  | AnyObject;

/**
 * API configuration object type.
 *
 * @typedef {Object} ApiConfig
 * @property {ApiAuthConfig} [auth] - Optional authentication configuration.
 * @property {number} [port] - Optional port number the API server will listen on.
 * @property {string} [host] - Optional host name the API server will bind to.
 * @property {unknown} [json] - Optional configuration for JSON parsing middleware.
 * @property {unknown} [urlencoded] - Optional configuration for URL-encoded parsing middleware.
 * @property {unknown} [cors] - Optional configuration for Cross-Origin Resource Sharing (CORS).
 * @property {unknown} [rateLimit] - Optional configuration for rate limiting.
 * @property {unknown} [security] - Optional security configuration.
 * @property {unknown} [logger] - Optional logger configuration or instance.
 * @property {unknown} [compression] - Optional configuration for response compression.
 * @property {unknown} [session] - Optional configuration for session management.
 * @property {Object.<string, unknown>} [key: string] - Additional properties.
 */
export type ApiConfig = {
  auth?: ApiAuthConfig;
  port?: number;
  host?: string;
  json?: unknown;
  urlencoded?: unknown;
  cors?: unknown;
  rateLimit?: unknown;
  security?: unknown;
  logger?: unknown;
  compression?: unknown;
  session?: unknown;
  [key: string]: any;
};

/**
 * WebSocket authentication configuration.
 *
 * @typedef {Object} WebSocketAuthConfig
 * @property {JwtConfig} [jwt] - Configuration for JWT authentication.
 * @property {ApiKeyConfig} [apiKey] - Configuration for API key authentication.
 * @property {UserPasswordConfig} [userPassword] - Configuration for user-password authentication (local, basic).
 * @property {Object.<string, any>} [key: string] - Additional properties.
 */
export type WebSocketAuthConfig = {
  jwt?: JwtConfig;
  apiKey?: ApiKeyConfig;
  userPassword?: UserPasswordConfig;
  [key: string]: any;
};

/**
 * WebSocketConfig interface that defines the configuration for a WebSocket server.
 */
export type WebSocketConfig = {
  /**
   * Type of the WebSocket auth configuration. Defaults to WebSocketAuthConfig.
   * @type {WebSocketAuthConfig}
   */
  auth?: EventBusAuthConfig;
  /**
   * The port on which the WebSocket server will listen.
   * @type {number}
   */
  port: number;
  /**
   * The path on which the WebSocket server will listen.
   * @type {string}
   */
  path: string;
  /**
   * The interval (in milliseconds) at which ping messages will be sent to the clients to keep the connection alive (optional).
   * @type {number}
   */
  pingInterval?: number;
  /**
   * The timeout (in milliseconds) for a ping response from the clients before considering the connection as closed (optional).
   * @type {number}
   */
  pingTimeout?: number;
  /**
   * The maximum payload size (in bytes) that the WebSocket server will accept (optional).
   * @type {number}
   */
  maxPayload?: number;
  /**
   * Additional configuration properties for the WebSocket server.
   * @type {Object.<string, unknown>}
   */
  [key: string]: any;
};

/**
 * EventBus authentication configuration.
 *
 * @typedef {Object} EventBusAuthConfig
 * @property {UserPasswordConfig} [userPassword] - Configuration for user-password authentication.
 * @property {Object.<string, any>} [key: string] - Additional properties.
 */
export type EventBusAuthConfig = {
  userPassword?: UserPasswordConfig;
  [key: string]: any;
};

/**
 * EventConfig interface that defines the configuration for an event bus.
 */
export type EventBusConfig = {
  /**
   * Type of the EventBus auth configuration. Defaults to EventBusAuthConfig.
   * @type {EventBusAuthConfig}
   */
  auth?: EventBusAuthConfig;
  /**
   * The type of the event bus, e.g., "rabbitmq" or "kafka".
   * @type {string}
   */
  type: string;
  /**
   * The URL for the event bus connection (optional).
   * @type {string}
   */
  url?: string;
  /**
   * An array of broker addresses for the event bus connection (optional).
   * @type {string[]}
   */
  brokers?: string[];
  /**
   * The client ID for the event bus connection (optional).
   * @type {string}
   */
  clientID?: string;
  /**
   * The group ID for the event bus connection (optional).
   * @type {string}
   */
  groupId?: string;
  /**
   * Additional configuration properties for the event bus.
   * @type {Object.<string, unknown>}
   */
  [key: string]: any;
};

export type AuthConfig =
  | ApiAuthConfig
  | EventBusAuthConfig
  | WebSocketAuthConfig
  | AnyObject;

/**
 * Configuration object type.
 *
 * @template A - Type of the API configuration. Defaults to ApiConfig.
 * @template S - Type of the WebSocket configuration. Defaults to WebSocketConfig.
 * @template E - Type of the Event configuration. Defaults to EventConfig.
 * @property {A} [api] - Optional API configuration.
 * @property {S} [socket] - Optional WebSocket configuration.
 * @property {E} [event] - Optional EventBus configuration.
 * @property {L} [logger] - Optional logger configuration or instance.
 * @property {Object.<string, any>} [key: string] - Additional properties.
 *
 * @type {Config<ApiConfig, WebSocketConfig, EventBusConfig>}
 */
export type Config<
  A = ApiConfig,
  S = WebSocketConfig,
  E = EventBusConfig,
  L = unknown
> = {
  api?: A;
  socket?: S;
  event?: E;
  logger?: L;
  [key: string]: any;
};
