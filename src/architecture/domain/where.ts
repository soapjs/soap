/* eslint-disable @typescript-eslint/no-non-null-assertion */
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
  | "like";
export type Condition = { left: string; operator: WhereOperator; right: any };
export type LogicalOperator = "and" | "or";
export type NestedCondition = {
  conditions: WhereCondition[];
  operator: LogicalOperator;
};
export type WhereCondition = Condition | NestedCondition;

export class Where {
  private currentCondition: WhereCondition | null = null;
  private currentLogical: LogicalOperator | null = null;
  private currentKey: string;

  valueOf(key: string): Where {
    this.currentKey = key;
    return this;
  }

  private _addCondition(operator: WhereOperator, value: any): Where {
    const newCondition: Condition = {
      left: this.currentKey,
      operator,
      right: value,
    };
    if (this.currentCondition) {
      if ("conditions" in this.currentCondition && this.currentLogical) {
        this.currentCondition.conditions.push(newCondition);
      } else {
        this.currentCondition = {
          conditions: [this.currentCondition as Condition, newCondition],
          operator: this.currentLogical || "and",
        };
      }
    } else {
      this.currentCondition = newCondition;
    }
    return this;
  }

  isEq(value: any): Where {
    return this._addCondition("eq", value);
  }

  isNotEq(value: any): Where {
    return this._addCondition("ne", value);
  }

  isLt(value: any): Where {
    return this._addCondition("lt", value);
  }

  isLte(value: any): Where {
    return this._addCondition("lte", value);
  }

  isGt(value: any): Where {
    return this._addCondition("gt", value);
  }

  isGte(value: any): Where {
    return this._addCondition("gte", value);
  }

  isIn(value: any[]): Where {
    return this._addCondition("in", value);
  }

  isNotIn(value: any[]): Where {
    return this._addCondition("nin", value);
  }

  like(value: string): Where {
    return this._addCondition("like", value);
  }

  get and(): Where {
    this.currentLogical = "and";
    return this;
  }

  get or(): Where {
    this.currentLogical = "or";
    return this;
  }

  brackets(fn: (where: Where) => void): Where {
    const nestedWhere = new Where();
    fn(nestedWhere);
    const nestedCondition = nestedWhere.result;
    if (nestedCondition) {
      if (this.currentCondition) {
        if ("conditions" in this.currentCondition && this.currentLogical) {
          this.currentCondition.conditions.push(nestedCondition);
        } else {
          this.currentCondition = {
            conditions: [this.currentCondition as Condition, nestedCondition],
            operator: this.currentLogical || "and",
          };
        }
      } else {
        this.currentCondition = nestedCondition;
      }
    }
    this.currentLogical = null;
    return this;
  }

  get result(): WhereCondition | null {
    return this.currentCondition;
  }
}

export default Where;
