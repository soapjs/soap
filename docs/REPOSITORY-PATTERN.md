# Repository Pattern Implementation Guide

This guide provides a comprehensive overview of the repository pattern implementation in SoapJS, covering repositories, sources, contexts, mappers, and decorators.

## Table of Contents

1. [Overview](#overview)
2. [Core Components](#core-components)
3. [Repositories](#repositories)
4. [Sources](#sources)
5. [Data Contexts](#data-contexts)
6. [Mappers](#mappers)
7. [Decorators](#decorators)
8. [Usage Examples](#usage-examples)
9. [Advanced Features](#advanced-features)
10. [Best Practices](#best-practices)

## Overview

The repository pattern provides an abstraction layer between your business logic and data access logic. This implementation supports multiple data sources (databases, APIs, WebSockets, blockchain) through a unified interface.

### Key Benefits

- **Source Agnostic**: Works with any data source
- **Testable**: Easy to mock and test
- **Flexible**: Multiple mapping strategies
- **Type Safe**: Full TypeScript support
- **Performance**: Efficient metadata caching

## Core Components

### Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Repository    │───▶│   Data Context  │───▶│     Source      │
│  (Business)     │    │   (Mapping)     │    │  (Data Access)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │     Mapper      │
                       │ (Transformation)│
                       └─────────────────┘
```

## Repositories

### 1. ReadRepository

The `ReadRepository` is designed for read-only operations. It provides optimized methods for querying data without the ability to modify the database.

**Key Features:**
- Read-only operations (find, count, aggregate)
- Optimized for query performance
- Safe for concurrent access
- Can be used in read replicas

**Methods:**
- `find()` - Retrieve entities based on criteria
- `count()` - Count entities based on criteria
- `aggregate()` - Execute aggregation operations

```typescript
import { ReadRepository } from '@soapjs/soap';

// Create a read-only repository
const userReadRepository = new ReadRepository<User, UserDocument>(context);

// Query operations
const users = await userReadRepository.find({ status: 'active' });
const count = await userReadRepository.count({ status: 'active' });
const stats = await userReadRepository.aggregate([
  { $group: { _id: '$status', count: { $sum: 1 } } }
]);
```

### 2. ReadWriteRepository

The `ReadWriteRepository` extends `ReadRepository` and adds write operations. It provides full CRUD capabilities while maintaining the benefits of the read repository.

**Key Features:**
- All read operations from ReadRepository
- Write operations (add, update, remove)
- Transaction support
- Optimistic locking

**Methods:**
- All methods from ReadRepository
- `add()` - Insert new entities
- `update()` - Update existing entities
- `remove()` - Delete entities

```typescript
import { ReadWriteRepository } from '@soapjs/soap';

// Create a read-write repository
const userRepository = new ReadWriteRepository<User, UserDocument>(context);

// Read operations
const users = await userRepository.find({ status: 'active' });

// Write operations
const newUser = new User('john@example.com', 'John Doe');
const result = await userRepository.add(newUser);

const updateResult = await userRepository.update({
  where: { id: 'user123' },
  updates: [{ status: 'inactive' }]
});

const deleteResult = await userRepository.remove({
  where: { status: 'inactive' }
});
```

## Sources

A **Source** represents the actual data storage mechanism. It provides a standardized interface for data operations regardless of the underlying technology.

### Source Interface

```typescript
interface Source<DocumentType = unknown> {
  collectionName: string;
  options?: SourceOptions<DocumentType>;
  
  find(query?: DbQuery): Promise<DocumentType[]>;
  count(query?: DbQuery): Promise<number>;
  aggregate<T = DocumentType>(query: DbQuery): Promise<T[]>;
  update(query: DbQuery): Promise<UpdateStats>;
  insert(query: DbQuery): Promise<DocumentType[]>;
  remove(query: DbQuery): Promise<RemoveStats>;
}
```

### Source Options

```typescript
type SourceOptions<T> = {
  modelClass?: ModelConstructor<T>;           // Class with decorators
  modelFieldMappings?: Record<string, FieldInfo>; // Manual mappings
  queries?: DbQueryFactory;                   // Custom query factory
  [key: string]: unknown;                     // Additional options
};
```

### Example: MongoDB Source

```typescript
import { MongoSource } from '@soapjs/soap-mongo';

const userSource = new MongoSource<UserModel>(mongo, 'users', {
  modelClass: UserModel,
  indexes: [
    { key: { email: 1 }, unique: true },
    { key: { createdAt: -1 } }
  ]
});
```

### Example: HTTP API Source

```typescript
class ApiSource<T> implements Source<T> {
  constructor(
    private baseUrl: string,
    public collectionName: string,
    public options?: SourceOptions<T>
  ) {}

  async find(query?: DbQuery): Promise<T[]> {
    const response = await fetch(`${this.baseUrl}/${this.collectionName}`, {
      method: 'POST',
      body: JSON.stringify(query)
    });
    return response.json();
  }

  // ... other methods
}
```

## Data Contexts

**Data Contexts** encapsulate the relationship between a source and its mapper. They provide type-safe access to data operations for specific entity types.

### Available Context Types

#### 1. DatabaseContext
For traditional database operations with transaction support.

```typescript
const userContext = new DatabaseContext(
  userSource,        // Source instance
  userMapper,        // Mapper instance
  sessionRegistry    // Session management
);

const userRepository = new ReadWriteRepository(userContext);
```

#### 2. HttpContext
For REST API integrations.

```typescript
const apiContext = new HttpContext(
  'https://api.example.com',  // Base URL
  apiSource,                  // HTTP source
  userMapper                  // Mapper
);

const userRepository = new ReadRepository(apiContext);
```

#### 3. SocketContext
For real-time data streams.

```typescript
const wsContext = new SocketContext(
  'ws://localhost:8080/users', // WebSocket endpoint
  wsSource,                    // WebSocket source
  userMapper                   // Mapper
);

const userRepository = new ReadRepository(wsContext);
```

#### 4. BlockchainContext
For blockchain data access.

```typescript
const blockchainContext = new BlockchainContext(
  'ethereum-mainnet',    // Network identifier
  blockchainSource,      // Blockchain source
  transactionMapper      // Mapper
);

const transactionRepository = new ReadRepository(blockchainContext);
```

#### 5. AnyContext
For custom or unclassified sources.

```typescript
const customContext = new AnyContext(
  customSource,     // Any source implementation
  customMapper      // Mapper
);

const customRepository = new ReadRepository(customContext);
```

## Mappers

**Mappers** handle the conversion between domain entities and data models. They support multiple strategies for different use cases.

### Basic Mapper Interface

```typescript
interface Mapper<EntityType = unknown, ModelType = unknown> {
  toEntity?(model: ModelType, ...args: any[]): EntityType;
  toModel?(entity: EntityType, ...args: any[]): ModelType;
  transformers?: TransformersMap; // Optional transformers
}
```

### 1. Custom Mapper

Full control over the mapping logic.

```typescript
class UserMapper implements Mapper<User, UserModel> {
  toEntity(model: UserModel): User {
    return new User({
      id: model._id.toString(),
      name: model.name,
      email: model.email.toLowerCase(),
      createdAt: new Date(model.created_at)
    });
  }

  toModel(entity: User): UserModel {
    return {
      _id: new ObjectId(entity.id),
      name: entity.name,
      email: entity.email,
      created_at: entity.createdAt.toISOString()
    };
  }
}
```

### 2. MetaMapper (Automatic)

Uses decorators and transformers for automatic mapping.

```typescript
// Define common transformers
const commonTransformers: TransformersMap = {
  id: {
    to: (value: string) => new ObjectId(value),
    from: (value: ObjectId) => value.toString()
  },
  createdAt: {
    to: (value: Date) => value.toISOString(),
    from: (value: string) => new Date(value)
  }
};

// Create automatic mapper
const userMapper = new MetaMapper(User, UserModel, commonTransformers);
```

### 3. Hybrid Approach

Combine MetaMapper with custom logic for complex cases.

```typescript
class HybridUserMapper extends MetaMapper<User, UserModel> {
  constructor() {
    super(User, UserModel, commonTransformers);
  }

  toEntity(model: UserModel): User {
    const baseEntity = super.toEntity(model);
    
    // Add custom business logic
    return {
      ...baseEntity,
      displayName: this.generateDisplayName(baseEntity),
      permissions: this.calculatePermissions(baseEntity)
    };
  }

  private generateDisplayName(user: User): string {
    return user.name ? user.name : user.email.split('@')[0];
  }

  private calculatePermissions(user: User): string[] {
    // Custom permission logic
    return ['read', 'write'];
  }
}
```

## Decorators

**Decorators** provide metadata for automatic field mapping and transformation. They enable a declarative approach to data modeling.

### @EntityProperty Decorator

The main decorator for defining entity-model field mappings.

```typescript
@EntityProperty(domainFieldName: string, options?: EntityPropertyOptions)
```

#### Basic Usage

```typescript
class UserModel {
  @EntityProperty("userId")
  _id: string;

  @EntityProperty("userName")
  name: string;

  @EntityProperty("userEmail")
  email: string;
}
```

#### Advanced Options

```typescript
class UserModel {
  @EntityProperty("userId", {
    type: String,
    unique: true,
    transformer: {
      to: (value: string) => new ObjectId(value),
      from: (value: ObjectId) => value.toString()
    }
  })
  _id: string;

  @EntityProperty("userName", {
    nullable: false,
    default: "Anonymous",
    index: true,
    transformer: {
      to: (value: string) => value.toLowerCase(),
      from: (value: string) => value.toUpperCase()
    }
  })
  name: string;

  @EntityProperty("userEmail", {
    unique: true,
    transformer: {
      to: (value: string) => value.toLowerCase(),
      from: (value: string) => value
    }
  })
  email: string;

  @EntityProperty("createdAt", {
    type: Date,
    default: () => new Date()
  })
  created_at: string;

  @EntityProperty("tags", {
    transformer: {
      to: (value: string[]) => value.join(','),
      from: (value: string) => value.split(',')
    }
  })
  tags_csv: string;
}
```

### PropertyTransformer Types

```typescript
type PropertyTransformer = {
  to?: (value: unknown, context?: any) => unknown;   // Entity → Model
  from?: (value: unknown, context?: any) => unknown; // Model → Entity
};

type TransformersMap = Record<string, PropertyTransformer>;
```

### Context in Transformers

Transformers receive context information for advanced scenarios.

```typescript
@EntityProperty("timestamp", {
  transformer: {
    to: (value: Date, context) => {
      // Access to entity, model, and additional args
      const { entity, model, args } = context;
      return value.toISOString();
    },
    from: (value: string, context) => {
      return new Date(value);
    }
  }
})
created_at: string;
```

## Usage Examples

### Example 1: Simple CRUD Repository

```typescript
// 1. Define Entity
class User implements Entity {
  constructor(
    public readonly id: string,
    public name: string,
    public email: string,
    public createdAt: Date
  ) {}
}

// 2. Define Model with decorators
class UserModel {
  @EntityProperty("id")
  _id: string;

  @EntityProperty("name")
  name: string;

  @EntityProperty("email")
  email: string;

  @EntityProperty("createdAt")
  created_at: Date;
}

// 3. Create components
const userSource = new MongoSource(mongo, 'users', { modelClass: UserModel });
const userMapper = new MetaMapper(User, UserModel);
const userContext = new DatabaseContext(userSource, userMapper, sessions);
const userRepository = new ReadWriteRepository(userContext);

// 4. Use repository
const users = await userRepository.find();
const newUser = await userRepository.add(new User('1', 'John', 'john@example.com', new Date()));
```

### Example 2: Multi-Source Architecture

```typescript
// Database repository for primary operations
const dbUserRepository = new ReadWriteRepository(
  new DatabaseContext(mongoSource, userMapper, sessions)
);

// Cache repository for fast reads
const cacheUserRepository = new ReadRepository(
  new HttpContext('http://cache-api:8080', cacheSource, userMapper)
);

// Real-time repository for live updates
const realtimeUserRepository = new ReadRepository(
  new SocketContext('ws://realtime:8080/users', wsSource, userMapper)
);

// Usage
class UserService {
  async getUser(id: string): Promise<User> {
    // Try cache first
    const cached = await cacheUserRepository.find({ where: { id } });
    if (cached.isSuccess && cached.value.length > 0) {
      return cached.value[0];
    }

    // Fallback to database
    const result = await dbUserRepository.find({ where: { id } });
    return result.value[0];
  }

  async updateUser(user: User): Promise<void> {
    await dbUserRepository.update({
      where: { id: user.id },
      updates: [user]
    });
  }
}
```

### Example 3: Complex Transformations

```typescript
class ProductModel {
  @EntityProperty("productId", {
    transformer: {
      to: (value: string) => new ObjectId(value),
      from: (value: ObjectId) => value.toString()
    }
  })
  _id: string;

  @EntityProperty("productName", {
    transformer: {
      to: (value: string) => value.toLowerCase().replace(/\s+/g, '-'),
      from: (value: string) => value.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    }
  })
  slug: string;

  @EntityProperty("price", {
    transformer: {
      to: (value: number) => Math.round(value * 100), // Store as cents
      from: (value: number) => value / 100            // Convert back to dollars
    }
  })
  price_cents: number;

  @EntityProperty("categories", {
    transformer: {
      to: (value: string[]) => JSON.stringify(value),
      from: (value: string) => JSON.parse(value)
    }
  })
  categories_json: string;

  @EntityProperty("metadata", {
    transformer: {
      to: (value: Record<string, any>) => {
        return Object.entries(value).map(([key, val]) => ({ key, value: val }));
      },
      from: (value: Array<{key: string, value: any}>) => {
        return value.reduce((acc, item) => ({ ...acc, [item.key]: item.value }), {});
      }
    }
  })
  metadata_pairs: Array<{key: string, value: any}>;
}
```

### Example 4: Testing with Mock Contexts

```typescript
describe('UserService', () => {
  let userService: UserService;
  let mockUserRepository: ReadWriteRepository<User>;

  beforeEach(() => {
    // Create mock source
    const mockSource: Source<UserModel> = {
      collectionName: 'users',
      find: jest.fn().mockResolvedValue([mockUserModel]),
      count: jest.fn().mockResolvedValue(1),
      aggregate: jest.fn(),
      update: jest.fn(),
      insert: jest.fn(),
      remove: jest.fn()
    };

    // Create mock mapper
    const mockMapper: Mapper<User, UserModel> = {
      toEntity: jest.fn().mockReturnValue(mockUser),
      toModel: jest.fn().mockReturnValue(mockUserModel)
    };

    // Create test context
    const testContext = new AnyContext(mockSource, mockMapper);
    mockUserRepository = new ReadWriteRepository(testContext);
    userService = new UserService(mockUserRepository);
  });

  it('should find users', async () => {
    const result = await userService.getUsers();
    expect(result).toHaveLength(1);
    expect(mockSource.find).toHaveBeenCalled();
  });
});
```

## Advanced Features

### Transformer Priority

Transformers are applied in this order of priority:

1. **Decorator transformers** (highest priority)
2. **Common transformers** (from TransformersMap)
3. **No transformation** (direct assignment)

```typescript
// This transformer takes precedence over common transformers
@EntityProperty("email", {
  transformer: {
    to: (value: string) => value.toLowerCase() // Always applied
  }
})
email: string;

// Common transformer only applies if no decorator transformer exists
const commonTransformers = {
  email: {
    to: (value: string) => value.toUpperCase() // Won't be used
  }
};
```

### Property Resolution

The `PropertyResolver` class helps resolve field mappings:

```typescript
const resolver = new PropertyResolver(UserModel);

// Resolve by domain field name
const fieldInfo = resolver.resolveDatabaseField("userName");
// Returns: { name: "userName", type: "String", modelFieldName: "name", ... }

// Resolve by model field name
const fieldInfo2 = resolver.resolveByModelField("name");
// Returns: { name: "userName", type: "String", domainFieldName: "userName", ... }

// Get all mappings
const allMappings = resolver.getAllPropertyMappings();
```

### Performance Optimization

- **Metadata Caching**: Reflection metadata is cached for performance
- **Lazy Initialization**: Components are initialized only when needed
- **Efficient Transformations**: Transformers are applied only when necessary

### Error Handling

All repository operations return `Result<T>` objects for safe error handling:

```typescript
const result = await userRepository.find({ where: { email: 'john@example.com' } });

if (result.isSuccess()) {
  const users = result.value;
  // Process users
} else {
  const { error } = result.failure;
  console.error('Failed to find users:', error.message);
}
```

## Best Practices

### 1. Choose the Right Mapping Strategy

- **MetaMapper**: For standard CRUD operations with simple transformations
- **Custom Mapper**: For complex business logic or performance-critical operations
- **Hybrid**: Combine both for flexibility

### 2. Organize Transformers

```typescript
// Create reusable transformer library
export const CommonTransformers = {
  objectId: {
    to: (value: string) => new ObjectId(value),
    from: (value: ObjectId) => value.toString()
  },
  
  date: {
    to: (value: Date) => value.toISOString(),
    from: (value: string) => new Date(value)
  },
  
  tags: {
    to: (value: string[]) => value.join(','),
    from: (value: string) => value.split(',')
  }
};

// Use in multiple mappers
const userMapper = new MetaMapper(User, UserModel, CommonTransformers);
const productMapper = new MetaMapper(Product, ProductModel, CommonTransformers);
```

### 3. Repository per Aggregate Root

Create one repository per aggregate root in your domain:

```typescript
// Good
class UserRepository extends ReadWriteRepository<User> {}
class OrderRepository extends ReadWriteRepository<Order> {}
class ProductRepository extends ReadRepository<Product> {}

// Avoid
class GenericRepository<T> extends ReadWriteRepository<T> {}
```

### 4. Use Appropriate Context Types

- **DatabaseContext**: For transactional operations
- **HttpContext**: For external API integrations
- **SocketContext**: For real-time features
- **AnyContext**: For testing or custom sources

### 5. Handle Null/Undefined Values

Always handle null/undefined in transformers:

```typescript
@EntityProperty("email", {
  transformer: {
    to: (value: string) => value ? value.toLowerCase() : null,
    from: (value: string) => value ? value : ''
  }
})
email: string;
```

### 6. Test Your Mappers

```typescript
describe('UserMapper', () => {
  let mapper: MetaMapper<User, UserModel>;

  beforeEach(() => {
    mapper = new MetaMapper(User, UserModel, CommonTransformers);
  });

  it('should map entity to model', () => {
    const entity = new User('1', 'John', 'john@example.com', new Date());
    const model = mapper.toModel(entity);
    
    expect(model._id.toString()).toBe('1');
    expect(model.name).toBe('John');
    expect(model.email).toBe('john@example.com');
  });

  it('should map model to entity', () => {
    const model = {
      _id: new ObjectId('507f1f77bcf86cd799439011'),
      name: 'John',
      email: 'john@example.com',
      created_at: new Date()
    };
    
    const entity = mapper.toEntity(model);
    
    expect(entity.id).toBe('507f1f77bcf86cd799439011');
    expect(entity.name).toBe('John');
    expect(entity.email).toBe('john@example.com');
  });
});
```

### 7. Choose the Right Repository Type

```typescript
// For read-only operations (queries, reports, dashboards)
const readRepo = new ReadRepository<Entity>(context);

// For full CRUD operations
const writeRepo = new ReadWriteRepository<Entity>(context);
```

### 8. Handle Errors Properly

```typescript
const result = await repository.find({ status: 'active' });

if (result.isSuccess()) {
  const entities = result.content;
  // Process entities
} else {
  const { error } = result.failure;
  // Handle error
}
```

### 9. Use Query Builders

```typescript
const query = new RepositoryQuery()
  .where('status', 'active')
  .where('createdAt', '>=', new Date('2024-01-01'))
  .orderBy('createdAt', 'desc')
  .limit(10);

const result = await repository.find(query);
```

### 10. Implement Proper Error Handling

```typescript
try {
  const result = await repository.add(entity);
  
  if (result.isSuccess()) {
    console.log('Entity added successfully');
  } else {
    console.error('Failed to add entity:', result.failure.error.message);
  }
} catch (error) {
  console.error('Unexpected error:', error);
}
```