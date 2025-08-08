# Where - Condition System in SoapJS

## Table of Contents

1. [Overview](#overview)
2. [Operators](#operators)
3. [Condition Classes](#condition-classes)
4. [Where Class](#where-class)
5. [Usage Examples](#usage-examples)
6. [Advanced Queries](#advanced-queries)
7. [MongoDB Integration](#mongodb-integration)
8. [Best Practices](#best-practices)

## Overview

The `Where` system in SoapJS is a powerful mechanism for building complex query conditions. It provides a type-safe API for creating conditions that can be used in repositories, queries, and other data operations.

### Key Features

- **Type Safety** - Full TypeScript support
- **Fluent API** - Chainable method calls
- **Complex Conditions** - Support for AND, OR, parentheses
- **Operators** - Various comparison types
- **Integration** - Works with repositories and query builders

## Operators

### Comparison Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `eq` | Equal | `isEq(5)` |
| `ne` | Not equal | `isNotEq(5)` |
| `gt` | Greater than | `isGt(5)` |
| `lt` | Less than | `isLt(5)` |
| `gte` | Greater than or equal | `isGte(5)` |
| `lte` | Less than or equal | `isLte(5)` |
| `in` | Contains in | `isIn([1,2,3])` |
| `nin` | Not contains in | `isNotIn([1,2,3])` |
| `like` | Similar to (regex) | `like("john%")` |

### Logical Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `and` | Logical AND | `and` |
| `or` | Logical OR | `or` |

## Condition Classes

### Condition

Represents a single comparison condition.

```typescript
import { Condition } from '@soapjs/soap';

const condition = new Condition('age', 'gt', 18);
// age > 18
```

### VariedCondition

Represents a complex condition with multiple sub-conditions.

```typescript
import { VariedCondition, Condition } from '@soapjs/soap';

const condition1 = new Condition('age', 'gt', 18);
const condition2 = new Condition('status', 'eq', 'active');
const variedCondition = new VariedCondition([condition1, condition2], 'and');
// age > 18 AND status = 'active'
```

### ConditionWithManyKeys

Represents a condition with multiple keys.

```typescript
import { ConditionWithManyKeys } from '@soapjs/soap';

const condition = new ConditionWithManyKeys(['firstName', 'lastName'], 'eq', 'John');
// firstName = 'John' OR lastName = 'John'
```

### NestedCondition

Represents a nested condition.

```typescript
import { NestedCondition, VariedCondition, Condition } from '@soapjs/soap';

const innerCondition = new VariedCondition([
  new Condition('age', 'gt', 18),
  new Condition('age', 'lt', 65)
], 'and');

const nestedCondition = new NestedCondition(innerCondition);
// (age > 18 AND age < 65)
```

## Where Class

The `Where` class is the main interface for building conditions. It provides a fluent API for creating complex queries.

### Basic Methods

#### valueOf(key)
Sets the key for the next condition.

```typescript
import { Where } from '@soapjs/soap';

const where = new Where();
where.valueOf('age').isGt(18);
```

#### Comparison Operators

```typescript
// Equal
where.valueOf('status').isEq('active');

// Not equal
where.valueOf('status').isNotEq('inactive');

// Greater than
where.valueOf('age').isGt(18);

// Less than
where.valueOf('price').isLt(100);

// Greater than or equal
where.valueOf('quantity').isGte(10);

// Less than or equal
where.valueOf('score').isLte(100);

// Contains in
where.valueOf('category').isIn(['electronics', 'books']);

// Not contains in
where.valueOf('status').isNotIn(['deleted', 'archived']);

// Similar to
where.valueOf('name').like('john%');
```

#### Logical Operators

```typescript
// AND
where.valueOf('age').isGt(18).and.valueOf('status').isEq('active');

// OR
where.valueOf('role').isEq('admin').or.valueOf('role').isEq('moderator');
```

#### Parentheses and Grouping

```typescript
where.brackets(w => {
  w.valueOf('age').isGt(18).and.valueOf('age').isLt(65);
}).and.valueOf('status').isEq('active');
```

## Usage Examples

### Basic Conditions

```typescript
import { Where } from '@soapjs/soap';

// Single condition
const where1 = new Where().valueOf('status').isEq('active');

// Multiple conditions with AND
const where2 = new Where()
  .valueOf('age').isGt(18)
  .and.valueOf('status').isEq('active')
  .and.valueOf('verified').isEq(true);

// Multiple conditions with OR
const where3 = new Where()
  .valueOf('role').isEq('admin')
  .or.valueOf('role').isEq('moderator')
  .or.valueOf('role').isEq('superuser');
```

### Complex Conditions

```typescript
// Nested conditions
const where = new Where()
  .valueOf('status').isEq('active')
  .and.brackets(w => {
    w.valueOf('age').isGt(18)
      .and.valueOf('age').isLt(65);
  })
  .and.brackets(w => {
    w.valueOf('role').isEq('admin')
      .or.valueOf('role').isEq('moderator');
  });
```

### Conditions with Lists

```typescript
// Checking if value is in list
const where = new Where()
  .valueOf('category').isIn(['electronics', 'books', 'clothing'])
  .and.valueOf('status').isNotIn(['deleted', 'archived']);
```

### Conditions with Regex

```typescript
// Text search
const where = new Where()
  .valueOf('name').like('john%')  // starts with "john"
  .or.valueOf('email').like('%@gmail.com');  // ends with "@gmail.com"
```

## Advanced Queries

### Complex Grouping

```typescript
const where = new Where()
  .valueOf('status').isEq('active')
  .and.brackets(w => {
    w.valueOf('age').isGte(18)
      .and.valueOf('age').isLte(65);
  })
  .and.brackets(w => {
    w.valueOf('role').isEq('admin')
      .or.valueOf('role').isEq('moderator')
      .or.brackets(innerW => {
        innerW.valueOf('role').isEq('user')
          .and.valueOf('verified').isEq(true);
      });
  });
```

### Conditions with IdType

```typescript
import { Where, IdType } from '@soapjs/soap';

// Using IdType for ID
const where = new Where()
  .valueOf(IdType.UUID).isEq('123e4567-e89b-12d3-a456-426614174000')
  .and.valueOf('status').isEq('active');
```

### Conditions with Multiple Keys

```typescript
// Checking multiple fields at once
const where = new Where()
  .valueOf(['firstName', 'lastName']).isEq('John')
  .or.valueOf(['email', 'username']).like('john%');
```

## MongoDB Integration

SoapJS includes a special parser for MongoDB in the `@soapjs/soap-mongo` package:

```typescript
import { MongoWhereParser } from '@soapjs/soap-mongo';
import { Where } from '@soapjs/soap';

const where = new Where()
  .valueOf('age').isGt(18)
  .and.valueOf('status').isEq('active');

// Convert to MongoDB query
const mongoQuery = MongoWhereParser.parse(where.build());
// Result: { age: { $gt: 18 }, status: { $eq: 'active' } }
```

### Operator Mapping

| Where Operator | MongoDB Operator |
|----------------|------------------|
| `eq` | `$eq` |
| `ne` | `$ne` |
| `gt` | `$gt` |
| `lt` | `$lt` |
| `gte` | `$gte` |
| `lte` | `$lte` |
| `in` | `$in` |
| `nin` | `$nin` |
| `like` | `$regex` |

### ObjectId Example

```typescript
import { MongoWhereParser } from '@soapjs/soap-mongo';
import { Where } from '@soapjs/soap';

const where = new Where()
  .valueOf('_id').isEq('507f1f77bcf86cd799439011');

const mongoQuery = MongoWhereParser.parse(where.build());
// Automatically converts string to ObjectId
// Result: { _id: ObjectId("507f1f77bcf86cd799439011") }
```

## Repository Integration

### Usage in ReadRepository

```typescript
import { ReadRepository } from '@soapjs/soap';
import { Where } from '@soapjs/soap';

const repository = new ReadRepository<User>(context);

// Find active users above 18 years old
const where = new Where()
  .valueOf('status').isEq('active')
  .and.valueOf('age').isGt(18);

const result = await repository.find({ where });
```

### Usage in ReadWriteRepository

```typescript
import { ReadWriteRepository } from '@soapjs/soap';
import { Where } from '@soapjs/soap';

const repository = new ReadWriteRepository<User>(context);

// Update status of inactive users
const where = new Where()
  .valueOf('lastLogin').isLt(new Date('2024-01-01'))
  .and.valueOf('status').isEq('active');

const result = await repository.update({
  where,
  updates: [{ status: 'inactive' }],
  methods: ['updateMany']
});
```

## Best Practices

### 1. Code Readability

```typescript
// Good - readable and understandable
const where = new Where()
  .valueOf('status').isEq('active')
  .and.valueOf('age').isGte(18)
  .and.valueOf('verified').isEq(true);

// Bad - difficult to read
const where = new Where().valueOf('status').isEq('active').and.valueOf('age').isGte(18).and.valueOf('verified').isEq(true);
```

### 2. Grouping Related Conditions

```typescript
// Good - logical grouping
const where = new Where()
  .valueOf('status').isEq('active')
  .and.brackets(w => {
    w.valueOf('role').isEq('admin')
      .or.valueOf('role').isEq('moderator');
  })
  .and.brackets(w => {
    w.valueOf('age').isGte(18)
      .and.valueOf('age').isLte(65);
  });
```

### 3. Using Constants for Frequently Used Conditions

```typescript
// Good - reusable conditions
const ACTIVE_USERS = new Where()
  .valueOf('status').isEq('active')
  .and.valueOf('deleted').isEq(false);

const ADULT_USERS = new Where()
  .valueOf('age').isGte(18);

// Usage
const where = ACTIVE_USERS.and.valueOf('age').isGte(18);
```

### 4. Query Optimization

```typescript
// Good - efficient query
const where = new Where()
  .valueOf('indexed_field').isEq('value')  // Use indexed fields
  .and.valueOf('status').isEq('active');

// Bad - inefficient query
const where = new Where()
  .valueOf('unindexed_field').like('%value%')  // Avoid LIKE at the beginning
  .and.valueOf('status').isEq('active');
```

### 5. Handling Null and Undefined

```typescript
// Good - checking null/undefined
const where = new Where()
  .valueOf('email').isNotEq(null)
  .and.valueOf('email').isNotEq(undefined);

// Or use special methods if available
const where = new Where()
  .valueOf('email').isNotNull();
```

### 6. Type Safety

```typescript
// Good - use types
interface User {
  id: string;
  name: string;
  age: number;
  status: 'active' | 'inactive';
}

const where = new Where()
  .valueOf('age').isGt(18)  // TypeScript will check type
  .and.valueOf('status').isEq('active');  // TypeScript will check union type
```

## Summary

The `Where` system in SoapJS provides a powerful and flexible tool for building complex query conditions. Thanks to fluent API, type safety, and integration with various databases, it enables creating readable and efficient queries.

Key advantages:
- **Type Safety** - Full TypeScript support
- **Fluent API** - Chainable method calls
- **Complex Conditions** - Support for AND, OR, parentheses
- **Integration** - Works with repositories and various databases
- **Readability** - Intuitive way of building queries 