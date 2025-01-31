/* eslint-disable @typescript-eslint/no-explicit-any */
import { Query, AnyObject } from "./types";

/**
 * A class representing a query builder.
 * @template QueryType - The type of query.
 */
export class QueryBuilder<QueryType = Query> {
  /**
   * Checks if an object conforms to the QueryBuilder structure.
   * @param {any} obj - The object to check.
   * @returns {boolean} True if the object is a QueryBuilder, false otherwise.
   */
  static isQueryBuilder(obj: any): obj is QueryBuilder {
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
   * @returns {QueryBuilder<QueryType>} - The updated query builder instance.
   */
  public with(args: AnyObject): QueryBuilder<QueryType> {
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
  public build(): QueryType {
    throw new Error("Method not implemented.");
  }
}
