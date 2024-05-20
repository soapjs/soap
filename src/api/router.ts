import { Route } from "./route";

/**
 * Abstract class representing a basic router.
 */
export abstract class Router {
  /**
   * Constructs a new router.
   * @param version Optional version prefix for the router.
   * @param versionPrefix Prefix for the version in the URL, defaults to "v".
   */
  constructor(
    public readonly version?: string,
    public readonly versionPrefix = "v"
  ) {}

  /**
   * Returns the versioned path.
   */
  get versionPath() {
    return this.version ? `/${this.versionPrefix}${this.version}` : "";
  }

  /**
   * Initializes the router with required components.
   * @param args Configuration arguments.
   */
  public abstract initialize(...args: unknown[]);

  /**
   * Sets up the routes for the router.
   * @param args Configuration arguments.
   */
  public abstract setupRoutes(...args: unknown[]): void;

  /**
   * Mounts a route or a set of routes.
   * @param data Route or set of routes to mount.
   */
  public abstract mount(data: Route | Route[]);
}
