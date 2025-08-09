/* eslint-disable @typescript-eslint/no-explicit-any */
import { Filter, Sort } from "./types";
import { Where } from "./where";

/**
 * Represents the parameters for aggregation.
 */
export class AggregationParams {
  /**
   * Checks if an object conforms to the AggregationParams structure.
   * @static
   * @param {any} obj - The object to check.
   * @returns {boolean} True if the object is an AggregationParams, false otherwise.
   */
  static isAggregationParams(obj: any): obj is AggregationParams {
    return (
      obj &&
      Object.keys(obj).length > 0 &&
      (obj.groupBy === undefined || Array.isArray(obj.groupBy)) &&
      (obj.filterBy === undefined || typeof obj.filterBy === "object") &&
      (obj.sort === undefined || typeof obj.sort === "object") &&
      (obj.sum === undefined || typeof obj.sum === "string") &&
      (obj.average === undefined || typeof obj.average === "string") &&
      (obj.min === undefined || typeof obj.min === "string") &&
      (obj.max === undefined || typeof obj.max === "string") &&
      (obj.count === undefined || typeof obj.count === "string") &&
      (obj.where === undefined || typeof obj.where === "object") &&
      (obj.limit === undefined || typeof obj.limit === "number") &&
      (obj.having === undefined || typeof obj.having === "object") &&
      (obj.offset === undefined || typeof obj.offset === "number")
    );
  }

  /**
   * Creates a new instance of AggregationParams with the provided options.
   * @static
   * @param {Object} options - The options for creating AggregationParams.
   * @param {string[]} options.groupBy - The field to group by.
   * @param {Filter} options.filterBy - The filter to apply.
   * @param {Sort} options.sort - The sorting criteria.
   * @param {string} options.sum - The field to calculate the sum.
   * @param {string} options.average - The field to calculate the average.
   * @param {string} options.min - The field to calculate the minimum value.
   * @param {string} options.max - The field to calculate the maximum value.
   * @param {string} options.count - The field to count.
   * @param {Where} options.where - The where clause.
   * @param {number} options.limit - The limit of results to retrieve.
   * @param {object} options.having - The having clause for filtering after grouping.
   * @param {number} options.offset - The offset of results to skip.
   * @returns {AggregationParams} A new instance of AggregationParams.
   */
  public static create(options: {
    groupBy?: string[];
    filterBy?: Filter;
    sort?: Sort;
    sum?: string;
    average?: string;
    min?: string;
    max?: string;
    count?: string;
    where?: Where;
    limit?: number;
    having?: object;
    offset?: number;
  }): AggregationParams {
    const { groupBy, filterBy, sort, sum, average, min, max, count, where, limit, having, offset } =
      options;
    return new AggregationParams(
      groupBy,
      filterBy,
      sort,
      sum,
      average,
      min,
      max,
      count,
      where,
      limit,
      having,
      offset
    );
  }

  /**
   * Constructs a new instance of AggregationParams.
   * @param {string[]} [groupBy] - The field to group by.
   * @param {Filter} [filterBy] - The filter to apply.
   * @param {Sort} [sort] - The sorting criteria.
   * @param {string} [sum] - The field to calculate the sum.
   * @param {string} [average] - The field to calculate the average.
   * @param {string} [min] - The field to calculate the minimum value.
   * @param {string} [max] - The field to calculate the maximum value.
   * @param {string} [count] - The field to count.
   * @param {Where} [where] - The where clause.
   * @param {number} [limit] - The limit of results to retrieve.
   * @param {object} [having] - The having clause for filtering after grouping.
   * @param {number} [offset] - The offset of results to skip.
   */
  constructor(
    public readonly groupBy?: string[],
    public readonly filterBy?: Filter,
    public readonly sort?: Sort,
    public readonly sum?: string,
    public readonly average?: string,
    public readonly min?: string,
    public readonly max?: string,
    public readonly count?: string,
    public readonly where?: Where,
    public readonly limit?: number,
    public readonly having?: object,
    public readonly offset?: number
  ) {}
}

/**
 * Represents the parameters for counting.
 */
export class CountParams {
  /**
   * Checks if an object conforms to the CountParams structure.
   * @static
   * @param {any} obj - The object to check.
   * @returns {boolean} True if the object is a CountParams, false otherwise.
   */
  static isCountParams(obj: any): obj is CountParams {
    return (
      obj &&
      Object.keys(obj).length > 0 &&
      (obj.sort === undefined || typeof obj.sort === "object") &&
      (obj.where === undefined || typeof obj.where === "object")
    );
  }
  /**
   * Creates a new instance of CountParams with the provided options.
   * @static
   * @param {Object} options - The options for creating CountParams.
   * @param {Sort} options.sort - The sorting criteria.
   * @param {Where} options.where - The where clause.
   * @returns {CountParams} A new instance of CountParams.
   */
  public static create(options: { sort?: Sort; where?: Where }): CountParams {
    const { sort, where } = options || {};
    return new CountParams(sort, where);
  }

  /**
   * Constructs a new instance of CountParams.
   * @param {Sort} [sort] - The sorting criteria.
   * @param {Where} [where] - The where clause.
   */
  constructor(public readonly sort?: Sort, public readonly where?: Where) {}
}

/**
 * Represents the parameters for finding.
 */
export class FindParams {
  /**
   * Checks if an object conforms to the FindParams structure.
   * @static
   * @param {any} obj - The object to check.
   * @returns {boolean} True if the object is a FindParams, false otherwise.
   */
  static isFindParams(obj: any): obj is FindParams {
    return (
      obj &&
      Object.keys(obj).length > 0 &&
      (obj.limit === undefined || typeof obj.limit === "number") &&
      (obj.offset === undefined || typeof obj.offset === "number") &&
      (obj.sort === undefined || typeof obj.sort === "object") &&
      (obj.where === undefined || typeof obj.where === "object") &&
      (obj.projection === undefined || typeof obj.projection === "object")
    );
  }
  /**
   * Creates a new instance of FindParams with the provided options.
   * @static
   * @param {Object} options - The options for creating FindParams.
   * @param {number} options.limit - The limit of results to retrieve.
   * @param {number} options.offset - The offset of results to skip.
   * @param {Sort} options.sort - The sorting criteria.
   * @param {Where} options.where - The where clause.
   * @param {object} options.projection - The projection to apply.
   * @returns {FindParams} A new instance of FindParams.
   */
  public static create(options: {
    limit?: number;
    offset?: number;
    sort?: Sort;
    where?: Where;
    projection?: object;
  }): FindParams {
    const { limit, sort, offset, where, projection } = options || {};
    return new FindParams(limit, offset, sort, where, projection);
  }
  /**
   * Constructs a new instance of FindParams.
   * @param {number} [limit] - The limit of results to retrieve.
   * @param {number} [offset] - The offset of results to skip.
   * @param {Sort} [sort] - The sorting criteria.
   * @param {Where} [where] - The where clause.
   * @param {object} [projection] - The projection to apply.
   */
  constructor(
    public readonly limit?: number,
    public readonly offset?: number,
    public readonly sort?: Sort,
    public readonly where?: Where,
    public readonly projection?: object
  ) {}
}

/**
 * Represents the parameters for removing.
 */
export class RemoveParams {
  /**
   * Checks if an object conforms to the RemoveParams structure.
   * @static
   * @param {any} obj - The object to check.
   * @returns {boolean} True if the object is a RemoveParams, false otherwise.
   */
  static isRemoveParams(obj: any): obj is RemoveParams {
    return (
      obj &&
      Object.keys(obj).length > 0 &&
      (obj.where === undefined || typeof obj.where === "object")
    );
  }
  /**
   * Creates a new instance of RemoveParams with the provided options.
   * @static
   * @param {Where} where - The where clause for removing.
   * @returns {RemoveParams} A new instance of RemoveParams.
   */
  public static create(where: Where): RemoveParams {
    return new RemoveParams(where);
  }

  /**
   * Constructs a new instance of RemoveParams.
   * @param {Where} [where] - The where clause for removing.
   */
  constructor(public readonly where?: Where) {}
}
export enum UpdateMethod {
  UpdateOne,
  UpdateMany,
}

export type UpdateEachParams<T = unknown> = {
  update: T;
  where: Where;
  method?: UpdateMethod;
};

/**
 * Represents the parameters for performing an update operation.
 *
 * @template UpdateType The type of the entities or partial entities being updated.
 */
export class UpdateParams<UpdateType = unknown> {
  /**
   * Checks if an object conforms to the UpdateParams structure.
   * @static
   * @param {any} obj - The object to check.
   * @returns {boolean} True if the object is a UpdateParams, false otherwise.
   */
  static isUpdateParams<UpdateType>(obj: any): obj is UpdateParams<UpdateType> {
    return (
      obj &&
      Object.keys(obj).length > 0 &&
      Array.isArray(obj.updates) &&
      Array.isArray(obj.where) &&
      Array.isArray(obj.methods) &&
      obj.updates.length === obj.where.length &&
      obj.where.length === obj.methods.length
    );
  }

  /**
   * Factory method for creating parameters to update multiple entities.
   *
   * @param {UpdateType} update The (partial) data to update.
   * @param {Where} where The where clause for the update.
   *
   * @returns {UpdateParams} An instance of UpdateParams.
   */
  public static createUpdateMany<UpdateType = unknown>(
    update: UpdateType,
    where: Where
  ) {
    return new UpdateParams([update], [where], [UpdateMethod.UpdateMany]);
  }

  /**
   * Factory method for creating parameters to update each entity with a different set of parameters.
   *
   * @param {UpdateEachParams<UpdateType>[]} params - The array of parameters for each update.
   *
   * @returns {UpdateParams} An instance of UpdateParams.
   */
  public static createUpdateEach<UpdateType = unknown>(
    params: UpdateEachParams<UpdateType>[]
  ) {
    const updates = [];
    const wheres = [];
    const methods = [];

    params.forEach(({ update, where, method }) => {
      updates.push(update);
      wheres.push(where);
      methods.push(method || UpdateMethod.UpdateOne);
    });

    return new UpdateParams(updates, wheres, methods);
  }

  /**
   * Factory method for creating parameters to update a single entity.
   *
   * @param {UpdateType} update The (partial) data to update.
   * @param {Where} where The where clause for the update.
   *
   * @returns {UpdateParams} An instance of UpdateParams.
   */
  public static createUpdateOne<UpdateType = unknown>(
    update: UpdateType,
    where: Where
  ) {
    return new UpdateParams([update], [where], [UpdateMethod.UpdateOne]);
  }

  /**
   * Constructs a new instance of UpdateParams.
   *
   * @param {UpdateType[]} updates The array of entities or partial entities to update.
   * @param {Where[]} where The array of where clauses corresponding to each update.
   * @param {UpdateMethod[]} methods The array of methods used for each update operation.
   */
  constructor(
    public readonly updates: UpdateType[],
    public readonly where: Where[],
    public readonly methods: UpdateMethod[]
  ) {}
}
