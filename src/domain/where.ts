/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { IdType } from "./id-type";

/* eslint-disable @typescript-eslint/no-explicit-any */
export type WhereOperator =
  | "eq"
  | "ne"
  | "gt"
  | "lt"
  | "gte"
  | "lte"
  | "in"
  | "nin"
  | "like"
  | "json_extract"
  | "full_text_search"
  | "array_contains"
  | "text_search";
export type LogicalOperator = "and" | "or";

/**
 * Class representing a condition with many keys.
 * @template T
 */
export class ConditionWithManyKeys<T = any> {
  /**
   * Create a condition with many keys.
   * @param {string[]} left - The left-hand side keys of the condition.
   * @param {WhereOperator} operator - The operator of the condition.
   * @param {T} right - The right-hand side value of the condition.
   */
  constructor(
    public readonly left: string[],
    public readonly operator: WhereOperator,
    public readonly right: T
  ) {}
}

/**
 * Class representing a condition.
 * @template T
 */
export class Condition<T = any> {
  /**
   * Create a condition.
   * @param {string} left - The left-hand side key of the condition.
   * @param {WhereOperator} operator - The operator of the condition.
   * @param {T} right - The right-hand side value of the condition.
   */
  constructor(
    public readonly left: string,
    public readonly operator: WhereOperator,
    public readonly right: T
  ) {}
}

/**
 * Class representing a varied condition.
 */
export class VariedCondition {
  /**
   * Create a varied condition.
   * @param {(Condition | VariedCondition)[]} conditions - The array of conditions.
   * @param {LogicalOperator} operator - The logical operator of the condition.
   */
  constructor(
    public readonly conditions: (Condition | VariedCondition)[],
    public readonly operator: LogicalOperator
  ) {}
}

/**
 * Class representing a nested condition.
 */
export class NestedCondition {
  /**
   * Create a nested condition.
   * @param {Condition | VariedCondition} result - The result of the nested condition.
   */
  constructor(public readonly result: Condition | VariedCondition) {}
}

/**
 * Class representing a where condition.
 */
export class WhereCondition {
  private _result: Condition | VariedCondition;
  private _operator: LogicalOperator;

  /**
   * Set the logical operator.
   * @param {LogicalOperator} operator - The logical operator to set.
   */
  setLogicalOperator(operator: LogicalOperator) {
    this._operator = operator;
  }

  /**
   * Build the condition.
   * @returns {Condition | VariedCondition} The built condition.
   */
  build() {
    return this._result;
  }

  /**
   * Add a condition to the where condition.
   * @param {Condition | ConditionWithManyKeys | VariedCondition | NestedCondition} condition - The condition to add.
   */
  addCondition(
    condition:
      | Condition
      | ConditionWithManyKeys
      | VariedCondition
      | NestedCondition
  ) {
    const { _result } = this;
    if (condition instanceof NestedCondition) {
      if (this._result) {
        this._result = new VariedCondition(
          [_result, condition.result],
          this._operator || "and"
        );
      } else {
        this._result = condition.result;
      }
    } else if (condition instanceof VariedCondition) {
      if (!this._result) {
        this._result = condition;
      } else if (
        this._result instanceof VariedCondition &&
        this._result.operator === condition.operator
      ) {
        this._result.conditions.push(...condition.conditions);
      } else {
        this._result = new VariedCondition(
          [_result, condition],
          this._operator || "and"
        );
      }
    } else if (condition instanceof ConditionWithManyKeys) {
      const bundle = new VariedCondition(
        condition.left.map(
          (left) => new Condition(left, condition.operator, condition.right)
        ),
        this._operator || "and"
      );
      if (
        this._result instanceof VariedCondition &&
        this._result.operator === bundle.operator
      ) {
        this._result.conditions.push(...bundle.conditions);
      } else {
        this._result = bundle;
      }
    } else if (condition instanceof Condition) {
      if (!this._result) {
        this._result = condition;
      } else if (
        this._result instanceof VariedCondition &&
        this._result.operator === this._operator
      ) {
        this._result.conditions.push(condition);
      } else {
        this._result = new VariedCondition(
          [_result, condition],
          this._operator || "and"
        );
      }
    }
  }
}

/**
 * Class representing a where condition.
 */
export class Where {
  private _registry: ("brackets" | "valueOf" | WhereOperator)[] = [];
  private _result: WhereCondition = new WhereCondition();
  private _keys: string[] = [];

  private addCondition(operator: WhereOperator, value: any) {
    let condition;
    this._registry.push(operator);

    if (this._keys.length > 1) {
      condition = new ConditionWithManyKeys(this._keys, operator, value);
    } else {
      condition = new Condition(this._keys[0], operator, value);
    }
    this._result.addCondition(condition);
  }

  /**
   * Build the condition.
   * @returns {Condition | VariedCondition} The built condition.
   */
  build(): Condition | VariedCondition {
    return this._result.build();
  }

  /**
   * Get the value of the key.
   * @param {string | IdType} key - The key to get the value for.
   * @returns {Where} The current Where instance.
   */
  valueOf(key: string | IdType): Where {
    const prop = typeof key === "string" ? key : `#id_type#${key.name}`;
    if (this._registry.at(-1) === "valueOf") {
      this._keys.push(prop);
    } else {
      this._keys = [prop];
    }
    this._registry.push("valueOf");
    return this;
  }

  /**
   * Add brackets to the where condition.
   * @param {Function} fn - The function defining the nested where condition.
   * @returns {Where} The current Where instance.
   */
  brackets(fn: (where: Where) => void): Where {
    const nestedWhere = new Where();
    fn(nestedWhere);
    this._result.addCondition(new NestedCondition(nestedWhere.build()));
    this._registry.push("brackets");
    return this;
  }

  isEq(value: any): Where {
    this.addCondition("eq", value);
    return this;
  }

  areEq(value: any): Where {
    return this.isEq(value);
  }

  isNotEq(value: any): Where {
    this.addCondition("ne", value);
    return this;
  }

  areNotEq(value: any): Where {
    return this.isNotEq(value);
  }

  isLt(value: any): Where {
    this.addCondition("lt", value);
    return this;
  }

  areLt(value: any): Where {
    return this.isLt(value);
  }

  isLte(value: any): Where {
    this.addCondition("lte", value);
    return this;
  }

  areLte(value: any): Where {
    return this.isLte(value);
  }

  isGt(value: any): Where {
    this.addCondition("gt", value);
    return this;
  }

  areGt(value: any): Where {
    return this.isGt(value);
  }

  isGte(value: any): Where {
    this.addCondition("gte", value);
    return this;
  }

  areGte(value: any): Where {
    return this.isGte(value);
  }

  isIn(value: any[]): Where {
    this.addCondition("in", value);
    return this;
  }

  areIn(value: any[]): Where {
    return this.isIn(value);
  }

  isNotIn(value: any[]): Where {
    this.addCondition("nin", value);
    return this;
  }

  areNotIn(value: any[]): Where {
    return this.isNotIn(value);
  }

  like(value: string): Where {
    this.addCondition("like", value);
    return this;
  }

  /**
   * JSON extract operation
   */
  jsonExtract(path: string, value: any): Where {
    this.addCondition("json_extract", { path, value });
    return this;
  }

  /**
   * Full-text search operation
   */
  fullTextSearch(searchTerm: string): Where {
    this.addCondition("full_text_search", searchTerm);
    return this;
  }

  /**
   * Array contains operation
   */
  arrayContains(values: any[]): Where {
    this.addCondition("array_contains", values);
    return this;
  }

  /**
   * Text search operation
   */
  textSearch(searchTerm: string): Where {
    this.addCondition("text_search", searchTerm);
    return this;
  }

  /**
   * Get the logical AND operator.
   * @returns {Where} The current Where instance.
   */
  get and(): Where {
    this._result.setLogicalOperator("and");
    return this;
  }

  /**
   * Get the logical OR operator.
   * @returns {Where} The current Where instance.
   */
  get or(): Where {
    this._result.setLogicalOperator("or");
    return this;
  }
}
