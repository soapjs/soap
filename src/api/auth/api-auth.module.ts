import { AuthModule } from "../../auth";
import { ApiAuthStrategy } from "./api-auth.strategy";

export abstract class ApiAuthModule implements AuthModule<ApiAuthStrategy> {
  abstract init<T = unknown>(...args: unknown[]): T[];
  /**
   * A dictionary of authentication strategies by name.
   * @type {{ [key: string]: StrategyType }}
   */
  protected strategies: Map<string, ApiAuthStrategy> = new Map();

  addStrategy(name: string, strategy: ApiAuthStrategy): void {
    this.strategies.set(name, strategy);
  }

  getStrategy(name: string): ApiAuthStrategy | undefined {
    return this.strategies.get(name);
  }
}
