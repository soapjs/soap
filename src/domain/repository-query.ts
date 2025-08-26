/* eslint-disable @typescript-eslint/no-explicit-any */
import { DbQuery, AnyObject } from "./types";

/**
 * A class representing a repository query builder.
 * @template QueryType - The type of query.
 */
export abstract class RepositoryQuery<QueryType = DbQuery> {
  /**
   * Checks if an object conforms to the RepositoryQuery structure.
   * @param {any} obj - The object to check.
   * @returns {boolean} True if the object is a RepositoryQuery, false otherwise.
   */
  static isQueryBuilder(obj: any): obj is RepositoryQuery {
    return (
      obj &&
      typeof obj.with === "function" &&
      typeof obj.build === "function" &&
      typeof obj.args === "object"
    );
  }

  /**
   * The arguments for the query.
   * @protected
   */
  protected args: AnyObject = {};

  /**
   * Sets the arguments for the query.
   * @param {AnyObject} args - The arguments for the query.
   * @returns {RepositoryQuery<QueryType>} - The updated query builder instance.
   */
  public with(args: AnyObject): RepositoryQuery<QueryType> {
    Object.keys(args).forEach((key) => {
      this.args[key] = args[key];
    });

    return this;
  }

  /**
   * Builds and returns the query.
   * @throws {Error} - This method is not implemented.
   * @returns {QueryType} - The built query.
   */
  abstract build(): QueryType;
}
