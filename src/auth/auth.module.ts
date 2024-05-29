/* eslint-disable @typescript-eslint/no-explicit-any */

export interface AuthModule<StrategyType> {
  /**
   * Adds a new authentication strategy to the module.
   * @param {string} name - The name of the strategy.
   * @param {StrategyType} strategy - The strategy to add.
   */
  addStrategy(name: string, strategy: StrategyType): void;

  /**
   * Gets an authentication strategy by name.
   * @param {string} name - The name of the strategy.
   * @returns {StrategyType | undefined} The authentication strategy, or undefined if not found.
   */
  getStrategy(name: string): StrategyType | undefined;
}
