# Query Builder - Building Queries in SoapJS

## Table of Contents

1. [Overview](#overview)
2. [Basic QueryBuilder Class](#basic-querybuilder-class)
3. [Usage in Repositories](#usage-in-repositories)
4. [Implementation Examples](#implementation-examples)
5. [MongoDB Integration](#mongodb-integration)
6. [Best Practices](#best-practices)

## Overview

`QueryBuilder` in SoapJS is an abstract base class that enables building complex queries in a type-safe and flexible manner. It is used by repositories to construct queries specific to different databases.

### Key Features

- **Abstraction** - Base class for extension
- **Type Safety** - Full TypeScript support
- **Fluent API** - Chainable method calls
- **Flexibility** - Ability to implement for different databases
- **Integration** - Works with repositories and Where system

## Basic QueryBuilder Class

### Structure

```typescript
import { QueryBuilder } from '@soapjs/soap';
import { DbQuery, AnyObject } from '@soapjs/soap';

export class QueryBuilder<QueryType = DbQuery> {
  protected args: AnyObject = {};

  public with(args: AnyObject): QueryBuilder<QueryType> {
    Object.keys(args).forEach((key) => {
      this.args[key] = args[key];
    });
    return this;
  }

  public build(): QueryType {
    throw new Error("Method not implemented.");
  }

  static isQueryBuilder(obj: any): obj is QueryBuilder {
    return (
      obj &&
      typeof obj.with === "function" &&
      typeof obj.build === "function" &&
      typeof obj.args === "object"
    );
  }
}
```

### Methods

#### with(args: AnyObject)
Adds arguments to the query builder.

```typescript
const query = new QueryBuilder()
  .with({ limit: 10, offset: 0 })
  .with({ sort: { createdAt: 'desc' } });
```

#### build(): QueryType
Builds and returns the final query. Must be implemented in inheriting classes.

#### isQueryBuilder(obj: any)
Checks if an object is an instance of QueryBuilder.

## Usage in Repositories

### Basic Usage

```typescript
import { ReadRepository, QueryBuilder, Where } from '@soapjs/soap';

const repository = new ReadRepository<User>(context);

// Usage with QueryBuilder
const query = new QueryBuilder()
  .with({ 
    where: new Where().valueOf('status').isEq('active'),
    limit: 10,
    offset: 0,
    sort: { createdAt: 'desc' }
  });

const result = await repository.find(query);
```

### Usage with Parameters

```typescript
import { ReadRepository, QueryBuilder, Where } from '@soapjs/soap';

const repository = new ReadRepository<User>(context);

// Building query with parameters
const buildUserQuery = (status: string, limit: number = 10) => {
  return new QueryBuilder()
    .with({ 
      where: new Where().valueOf('status').isEq(status),
      limit,
      sort: { createdAt: 'desc' }
    });
};

const result = await repository.find(buildUserQuery('active', 20));
```

## Implementation Examples

### Simple Query Builder

```typescript
import { QueryBuilder, DbQuery } from '@soapjs/soap';

interface SimpleQuery {
  filter: Record<string, any>;
  options: {
    limit?: number;
    offset?: number;
    sort?: Record<string, 1 | -1>;
  };
}

export class SimpleQueryBuilder extends QueryBuilder<SimpleQuery> {
  build(): SimpleQuery {
    const { where, limit, offset, sort } = this.args;
    
    return {
      filter: where ? where.build() : {},
      options: {
        ...(limit && { limit }),
        ...(offset && { offset }),
        ...(sort && { sort })
      }
    };
  }
}
```

### Advanced Query Builder

```typescript
import { QueryBuilder, DbQuery, Where } from '@soapjs/soap';

interface AdvancedQuery {
  filter: Record<string, any>;
  options: {
    limit?: number;
    offset?: number;
    sort?: Record<string, 1 | -1>;
    projection?: Record<string, 1 | 0>;
  };
  aggregation?: {
    groupBy?: string[];
    having?: Record<string, any>;
  };
}

export class AdvancedQueryBuilder extends QueryBuilder<AdvancedQuery> {
  build(): AdvancedQuery {
    const { 
      where, 
      limit, 
      offset, 
      sort, 
      projection,
      groupBy,
      having 
    } = this.args;
    
    const query: AdvancedQuery = {
      filter: where ? where.build() : {},
      options: {
        ...(limit && { limit }),
        ...(offset && { offset }),
        ...(sort && { sort }),
        ...(projection && { projection })
      }
    };

    if (groupBy || having) {
      query.aggregation = {
        ...(groupBy && { groupBy }),
        ...(having && { having })
      };
    }

    return query;
  }

  // Additional helper methods
  select(fields: string[]): AdvancedQueryBuilder {
    const projection: Record<string, 1> = {};
    fields.forEach(field => {
      projection[field] = 1;
    });
    return this.with({ projection }) as AdvancedQueryBuilder;
  }

  groupBy(fields: string[]): AdvancedQueryBuilder {
    return this.with({ groupBy: fields }) as AdvancedQueryBuilder;
  }

  having(conditions: Record<string, any>): AdvancedQueryBuilder {
    return this.with({ having: conditions }) as AdvancedQueryBuilder;
  }
}
```

## MongoDB Integration

### MongoQueryFactory

SoapJS includes a ready-made implementation for MongoDB in the `@soapjs/soap-mongo` package:

```typescript
import { MongoQueryFactory } from '@soapjs/soap-mongo';
import { FindParams, Where } from '@soapjs/soap';

const queryFactory = new MongoQueryFactory<User>();

// Creating find query
const findParams: FindParams = {
  where: new Where().valueOf('status').isEq('active'),
  limit: 10,
  offset: 0,
  sort: { createdAt: 'desc' }
};

const mongoQuery = queryFactory.createFindQuery(findParams);
// Result: { filter: { status: { $eq: 'active' } }, options: { limit: 10, skip: 0, sort: { createdAt: -1 } } }
```

### MongoDB Implementation Example

```typescript
import { QueryBuilder } from '@soapjs/soap';
import { MongoFindQueryParams } from '@soapjs/soap-mongo';

export class MongoQueryBuilder extends QueryBuilder<MongoFindQueryParams> {
  build(): MongoFindQueryParams {
    const { where, limit, offset, sort, projection } = this.args;
    
    const filter = where ? where.build() : {};
    const options: any = {};

    if (limit) {
      options.limit = limit;
    }

    if (offset) {
      options.skip = offset;
    }

    if (sort) {
      options.sort = sort;
    }

    if (projection) {
      options.projection = projection;
    }

    return { filter, options };
  }
}
```

### Usage with MongoQueryFactory

```typescript
import { MongoQueryFactory } from '@soapjs/soap-mongo';
import { ReadRepository, Where } from '@soapjs/soap';

const repository = new ReadRepository<User>(context);
const queryFactory = new MongoQueryFactory<User>();

// Building query
const where = new Where()
  .valueOf('status').isEq('active')
  .and.valueOf('age').isGte(18);

const query = queryFactory.createFindQuery({
  where,
  limit: 10,
  sort: { createdAt: 'desc' }
});

// Usage in repository
const result = await repository.find(query);
```

## Repository Integration

### Usage in ReadRepository

```typescript
import { ReadRepository, QueryBuilder, Where } from '@soapjs/soap';

const repository = new ReadRepository<User>(context);

// Basic query
const basicQuery = new QueryBuilder()
  .with({ 
    where: new Where().valueOf('status').isEq('active') 
  });

const activeUsers = await repository.find(basicQuery);

// Advanced query
const advancedQuery = new QueryBuilder()
  .with({ 
    where: new Where()
      .valueOf('status').isEq('active')
      .and.valueOf('age').isGte(18),
    limit: 20,
    offset: 40,
    sort: { createdAt: 'desc' }
  });

const paginatedUsers = await repository.find(advancedQuery);
```

### Usage in ReadWriteRepository

```typescript
import { ReadWriteRepository, QueryBuilder, Where } from '@soapjs/soap';

const repository = new ReadWriteRepository<User>(context);

// Update query
const updateQuery = new QueryBuilder()
  .with({ 
    where: new Where()
      .valueOf('lastLogin').isLt(new Date('2024-01-01'))
      .and.valueOf('status').isEq('active')
  });

const result = await repository.update({
  where: updateQuery.args.where,
  updates: [{ status: 'inactive' }],
  methods: ['updateMany']
});
```

### Usage with Aggregation

```typescript
import { ReadRepository, QueryBuilder, Where } from '@soapjs/soap';

const repository = new ReadRepository<User>(context);

// Query with aggregation
const aggregationQuery = new QueryBuilder()
  .with({ 
    where: new Where().valueOf('status').isEq('active'),
    groupBy: ['department'],
    having: { count: { $gte: 5 } }
  });

const departmentStats = await repository.aggregate(aggregationQuery);
```

## Best Practices

### 1. Creating Reusable Query Builders

```typescript
// ✅ Good - reusable query builders
export class UserQueryBuilder extends QueryBuilder {
  static activeUsers(limit?: number) {
    return new UserQueryBuilder()
      .with({ 
        where: new Where().valueOf('status').isEq('active'),
        ...(limit && { limit })
      });
  }

  static byDepartment(department: string, limit?: number) {
    return new UserQueryBuilder()
      .with({ 
        where: new Where().valueOf('department').isEq(department),
        ...(limit && { limit })
      });
  }
}

// Usage
const activeUsers = await repository.find(UserQueryBuilder.activeUsers(10));
const itUsers = await repository.find(UserQueryBuilder.byDepartment('IT', 20));
```

### 2. Parameter Validation

```typescript
export class ValidatedQueryBuilder extends QueryBuilder {
  with(args: AnyObject): ValidatedQueryBuilder {
    // Validate limit
    if (args.limit && (args.limit < 1 || args.limit > 1000)) {
      throw new Error('Limit must be between 1 and 1000');
    }

    // Validate offset
    if (args.offset && args.offset < 0) {
      throw new Error('Offset must be non-negative');
    }

    return super.with(args) as ValidatedQueryBuilder;
  }
}
```

### 3. Type Safety

```typescript
interface UserQuery {
  filter: Record<string, any>;
  options: {
    limit?: number;
    offset?: number;
    sort?: Record<string, 1 | -1>;
  };
}

export class TypedUserQueryBuilder extends QueryBuilder<UserQuery> {
  build(): UserQuery {
    const { where, limit, offset, sort } = this.args;
    
    return {
      filter: where ? where.build() : {},
      options: {
        ...(limit && { limit }),
        ...(offset && { offset }),
        ...(sort && { sort })
      }
    };
  }
}
```

### 4. Fluent API

```typescript
export class FluentQueryBuilder extends QueryBuilder {
  limit(value: number): FluentQueryBuilder {
    return this.with({ limit: value }) as FluentQueryBuilder;
  }

  offset(value: number): FluentQueryBuilder {
    return this.with({ offset: value }) as FluentQueryBuilder;
  }

  sort(field: string, direction: 1 | -1 = -1): FluentQueryBuilder {
    return this.with({ sort: { [field]: direction } }) as FluentQueryBuilder;
  }

  where(condition: Where): FluentQueryBuilder {
    return this.with({ where: condition }) as FluentQueryBuilder;
  }
}

// Usage
const query = new FluentQueryBuilder()
  .where(new Where().valueOf('status').isEq('active'))
  .limit(10)
  .offset(20)
  .sort('createdAt', -1);
```

### 5. Error Handling

```typescript
export class SafeQueryBuilder extends QueryBuilder {
  build(): any {
    try {
      const { where, limit, offset, sort } = this.args;
      
      // Check required parameters
      if (!where) {
        throw new Error('Where condition is required');
      }

      return {
        filter: where.build(),
        options: {
          ...(limit && { limit }),
          ...(offset && { offset }),
          ...(sort && { sort })
        }
      };
    } catch (error) {
      throw new Error(`Failed to build query: ${error.message}`);
    }
  }
}
```

### 6. Optimization

```typescript
export class OptimizedQueryBuilder extends QueryBuilder {
  build(): any {
    const { where, limit, offset, sort } = this.args;
    
    // Optimization - default limit if not provided
    const optimizedLimit = limit || 50;
    
    // Optimization - maximum limit
    const finalLimit = Math.min(optimizedLimit, 1000);
    
    return {
      filter: where ? where.build() : {},
      options: {
        limit: finalLimit,
        ...(offset && { offset }),
        ...(sort && { sort })
      }
    };
  }
}
```

## Summary

`QueryBuilder` in SoapJS is a powerful tool for building complex queries in a type-safe and flexible manner. Thanks to its abstract structure, it's possible to create implementations specific to different databases while maintaining a consistent interface.

Key advantages:
- **Abstraction** - Ability to implement for different databases
- **Type Safety** - Full TypeScript support
- **Fluent API** - Chainable method calls
- **Flexibility** - Ability to extend with additional functionality
- **Integration** - Works with repositories and Where system
- **Reusability** - Ability to create ready-made query builders 