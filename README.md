# SoapJS
## OMG, Yet Another Framework
Yes, we know there are many frameworks out there, and they are excellent. However, there's a gap: separating logic from the framework itself to ease the trouble during migration or framework switching. As backend developers, we often had to rewrite code tailored to specific frameworks. SoapJS, rooted in Clean Architecture, offers customizable code structures through configuration files and presets, allowing you to decide on your code's structure. We provide a solution that can be adapted and applied as preferred, eliminating the need to start from scratch. Our CLI facilitates file generation based on configurations, letting developers focus on writing the actual code.

## Description
**SoapJS** is a framework designed to empower developers by adhering to the principles of Clean Architecture, enhancing modularity and maintainability in web application development.

## Development Status and Future Plans

The `@soapjs/soap` package, along with its related packages, is currently under active development. As these packages have not yet reached version 1.0.0, they are subject to potentially significant changes. We release updates at least once a week.Currently, the documentation on [docs.soapjs.com](http://docs.soapjs.com) is not being updated in real-time but will undergo comprehensive updates to coincide with the release of version 1.0.0 of our packages.

**Pre-release Usage Notice:**
While you are welcome to download and use the packages, please be aware that they are not yet considered stable releases. The official announcement and launch of these packages will coincide with the release of version 1.0.0.

**Current and Upcoming Features:**
- Our development roadmap includes releasing fully documented and tested packages for several frameworks and technologies:
  - **Express Framework Integration** (`@soapjs/soap-express`)
  - **NestJS Framework Integration** (`@soapjs/soap-nestjs`)
  - **Authentication** (`@soapjs/soap-auth`)
  - **Database Integration** for:
    - MongoDB (`@soapjs/soap-node-mongo`)
    - PostgreSQL (`@soapjs/soap-node-postgres`)
    - Redis (`@soapjs/soap-node-redis`)
    - MySQL (`@soapjs/soap-node-mysql`)
  - **CLI Updates**: We are also focusing on updating the Command Line Interface to enhance usability and features.

**Future Expansions:**
- Following the initial releases, we plan to extend support to additional frameworks and platforms such as:
  - **NestJS**: Dedicated package integration.
  - **AWS**: Solutions tailored for Amazon Web Services.
  - **WebSockets**: Dedicated package for the `ws` WebSocket integration.
  - **Events**: Dedicated package for messaging integration.
  - And more based on community feedback and demand.

We value community input and encourage users to provide feedback and contribute to the development process. Stay tuned for more updates and please consider the current stage of development when using the packages in production environments.

## Getting Started
Everything you need to know can be found at [SoapJS Documentation](https://docs.soapjs.com).

To install the package, use the command:
```
npm i @soapjs/soap
# or
# yarn add @soapjs/soap
```
However, we recommend familiarizing yourself with the documentation and CLI at the provided address.

## Usage
This package does not include dependencies, IoC, databases, or web frameworks; you must provide them on your own. This makes the SoapJS package flexible. We also have several dedicated packages (some still in development).

For MongoDB, Redis, and MySQL databases, you will find necessary helpers in the packages `@soapjs/soap-node-mongo`, `@soapjs/soap-node-redis`, and `@soapjs/soap-node-mysql` respectively. 

There are also dedicated packages for web frameworks, containing dedicated routers, helpers, and startup scripts. They are divided accordingly: `@soapjs/soap-express`, `@soapjs/soap-nestjs`, and `@soapjs/soap-aws`.

Using the `@soapjs/soap` package:

Soap provides interfaces, abstractions, and basic implementations to help organize code and maintain the structure you define in clean architecture.

Example usage:

### Dependencies
Every created component from the domain layer must be bound in a container. How you do this depends on you; you can use our container or, for example, Inversify. It's important to use strings as labels and bind interfaces to implementations from the data layer directly or to classes like controllers or use cases.

```typescript
import * as Soap from '@soapjs/soap';
import { Container } from 'inversify';

export class Dependencies implements Soap.Dependencies {
  constructor(public readonly container: Container){}
  public async configure() {
    // rest of the components ...
    this.container
      .bind<CustomerController>(CustomerController.Token)
      .to(CustomerController);
  }
}
```

### Route
A route is an object containing a description, route instructions, and the handler to be invoked upon route activation. A route may also contain options regarding authentication, validation, or request and response mapping. Middleware implementations for these options must be provided by you. To construct a `RouteIO`, use the interface from the `@soapjs/soap` package.

```typescript
import * as Soap from '@soapjs/soap';
import { Container } from 'inversify';

export class GetCustomerDetailsRoute extends Soap.GetRoute {
  static create(container: Container) {
    const controller = container.get<CustomersController>(CustomersController.Token);
    const handler = controller.getCustomerDetails.bind(controller);

    // ... other setup operations

    return new GetCustomerDetailsRoute('customers/:id', handler, {
      io: new GetCustomerDetailsRouteIO()
    });
  }
}
```

### Route Model
Similar to a regular model, but this one should reside alongside routes rather than with other database models. It's a special type of model dedicated only to routes.

```typescript
export type GetCustomerDetailsResponse = {
  orders: OrderModel[],
  address: AddressModel,
  loyalty_points: number
}
```

### RouteIO
Contains methods for parsing a request into a handler's input and vice versa, parsing the handler's result into a response. `RouteIO` should be executed before the handler is run. 

```typescript
import * as Soap from '@soapjs/soap';
import { Request, Response } from 'express';

export class GetCustomerDetailsRouteIO implements Soap.RouteIO<Customer, GetCustomerDetailsResponse, Request, Response> {
  public toResponse(response: Response, result: Result<Customer>) {
    if (result.isFailure) {
      // if error is instanceof Soap.HttpError or 500
      const status = result.failure.error.status || 500;
      const message = result.failure.error.message || 'YOUR MESSAGE';
      
      response.status(status).send(message);
    } else {
      const { ... } = result.content;
      // map result content to output if needed
      response.status(200).send({...});
    }
  }
  
  public fromRequest(request: Request): string {
    // add appropriate logic and data validation
    return request.params.id;
  }
}
```

### Router

The `Router` in `@soapjs/soap` serves to manage routes, specifically embedding and executing them. To utilize the router, the framework and all dependencies must be initialized beforehand. The actual implementation of a router, such as `ExpressRouter` from the `@soapjs/soap-express` package, requires you to either write your own code or use existing implementations.

Using a router is not mandatory but is recommended to facilitate the definition of paths and the management of settings associated with them. The router is also natively supported by the framework's CLI.

#### Example Implementation for an Express-based Router

```typescript
import { ExpressRouter } from '@soapjs/soap-express';

// Example implementation for an Express-based router
export class MyRouter extends ExpressRouter {
  constructor(private container: Container) {
    super('api', 'v1');
  }

  public setupRoutes(): void {
    /**
     * Depending on your choice of where to specify the handler source, you can do it in the setupRoutes() method - the default approach - or inside the Route itself.
     */
    this.mount(GetCustomerDetailsRoute.create(this.container));
  }
}
```

The content of `setupRoutes` is not predefined but requires the use of `this.mount` to add a route to the router. If you wish to implement your own router or one for a framework other than Express, check the implementation of `ExpressRouter` in `@soapjs/soap-express` and use it as a basis for writing your own.

### Controllers

These are entry points for logic, where you should place and manage use cases. They shouldn't contain complex logic. Handlers, i.e., controller methods assigned to specific routes, can accept input data but should not directly handle, for example, requests. Instead, they should receive input prepared and mapped by `RouteIO`. Handlers return `Result` objects with expected outcomes or errors. You decide what to do with these in `RouteIO`.

```typescript
export class CustomerController {
  static Token = 'CustomerController';

  public async getCustomerDetails(input: string): Promise<Result<Customer>> {
    let result: Result<Customer>;
    // call use cases (may include simple logic)
    return result;
  }
  ...
}
```

### Use Case

These are classes with a single public `execute` method, used to perform one more or less complex task. A use case may invoke other use cases to achieve the desired result. Use cases should be as simple as possible, but how you organize them depends on you.

```typescript
import * as Soap from '@soapjs/soap';
// Example use case class
export class ProcessOrderUseCase implements Soap.UseCase<OrderConfirmation>{
  static Token = "ProcessOrderUseCase";

  public async execute(
    orderItems: Product[],
    customerDetails: Customer,
    paymentMethod: string,
  ): Promise<Result<OrderConfirmation>> {
    let confirmation: OrderConfirmation;
    // logic ...
    return Result.withSuccess(confirmation);
  }
}
```

### Repository and RepositoryImpl

Repositories are components that perform operations on databases. They typically use one data context (i.e., database client or specific table), mapper, and query builder. Repositories should handle all data-related logic but not business logic (exceptions may include decisions like caching data). `RepositoryImpl` contains basic implementations and is tailored to using a single data context. If you need custom (dedicated) methods, parameters, or want to use multiple contexts, such as for aggregation, you should write your own implementation, perhaps by extending `RepositoryImpl`. Below are examples of setting up a repository and creating custom ones.

```typescript
// Example repository abstract class (or interface)
export abstract class CustomerRepository extends Soap.Repository<Customer> {
  static Token = "CustomerRepository";
  // place for additional methods ...
}

// Example custom repository implementation
export class CustomerRepositoryImpl extends Soap.RepositoryImpl<Customer, CustomerMongoModel> implements CustomerRepository {
  constructor(
    context: Soap.DatabaseContext<Customer, CustomerMongoModel>,
    // feel free to add more contexts if you need
  ) {
    super(context);
  }
  // place for additional methods ...
}

// Example setup of repository and creation of custom ones in the Dependencies class
export class Dependencies implements Soap.Dependencies {
  public async configure(config: Config) {
    // Creates a MongoDB client using the configuration provided.
    // The 'SoapMongo.create' function initializes a client based on MongoDB settings defined in 'config.mongo'.
    const mongoClient = await SoapMongo.create(config.mongo);

    // Creates a new DatabaseContext:
    // 1. MongoSource: Represents the MongoDB collection using the MongoDB client. 
    //    'CustomerMongoModel' refers to the model class that maps the MongoDB collection 'customers'.
    // 2. CustomerMongoMapper: Handles the mapping of data between the domain entity and the database model.
    // 3. MongoSessions: Represents the Mongo database session registry.
    // 4. The 'modelClass' option specifies the model class that includes decorators for field mapping.
    const context = new Soap.DatabaseContext(
      new MongoSource<CustomerMongoModel>(mongoClient, 'customers'),
      new CustomerMongoMapper(),
      new MongoSessions(),
      { modelClass: CustomerMongoModel }
    );

    // Creates an instance of 'CustomerRepositoryImpl' with the configured context.
    // This repository implementation will handle all data operations for 'Customer' entities.
    const impl = new CustomerRepositoryImpl(context);
    // Alternatively, if using a generic repository pattern:
    // const impl = new RepositoryImpl(context)

    // Binds the 'CustomerRepositoryImpl' instance to the 'CustomerRepository' token in the IoC container.
    // This makes 'CustomerRepositoryImpl' available for injection throughout the application.
    this.container
      .bind<CustomerRepository>(CustomerRepository.Token)
      .toConstantValue(new CustomerRepositoryImpl(context));
  }
}
```

### Sources (Collections)
Sources are components that perform operations directly on a collection or table in the database using a client. To use them, you need a dedicated implementation, like `@soapjs/soap-node-mongo`, or you can write your own, ensuring consistency with the interface.

```typescript
export class CustomerMongoSource extends MongoSource<CustomerMongoModel> {
  constructor(client: MongoSource) {
    super(client, 'customers.collection');
  }
  // additional methods...
}
```

### Mapper
This component is used to map entities to models and vice versa, similar to `RouteIO`. Mappers should handle a single type of document, so you should create mappers per collection and repository. You don't necessarily need to use the mapper in your code if you're using existing implementations. `RepositoryImpl` handles this before and after executing commands on the collection, depending on the type of operation.

```typescript
export class CustomerMongoMapper extends MongoMapper<Customer, CustomerMongoModel> {
  public toEntity(model: CustomerMongoModel): Customer {
    const { ... } = model;
    // parsing model types to entity types ...
    return new Customer(...);
  }
  
  public fromEntity(entity:Customer): CustomerMongoModel {
    const { ... } = entity;
    // parsing entity types to model types ...
    return removeUndefinedProperties({ ... });
  }
}
```

### Entity
Mabe unlike in other frameworks, entities here are used as data containers in the domain layer. They may contain helper methods but should not include mappers to database documents (that's what mappers are for), and they should not directly reference databases. Treat them as data representations in logic, independent of the data source.

```typescript
export class Customer {
  constructor(
    public readonly orders: Order[],
    public readonly address: Address,
    public readonly loyaltyPoints: number) {}
}
```

### Model
`@soapjs/soap` allows defining data models either as classes or types. The choice between these depends on whether you prefer using decorators for automatic field mapping or manual field mappings for flexibility without decorators.

#### Class-based Models with Decorators
- **Use when**: You prefer an object-oriented approach with automatic field mapping via decorators.
- **Benefits**: Simplifies ORM/ODM integration, supports encapsulation of business logic, and facilitates data validation.
- **Example**:
  ```typescript
  import { ObjectId } from 'mongodb';
  import { EntityField } from '@soapjs/soap';

  class CustomerMongoModel {
    @EntityField('customerId')
    _id: ObjectId;

    @EntityField('customerName')
    name: string;
  }

  const customerSource = new MongoSource<CustomerMongoModel>(..., { modelClass: CustomerMongoModel });
  ```

#### Type-based Models with Manual Field Mappings
- **Use when**: You need flexibility or do not wish to use class decorators, often suitable for projects with schema-less NoSQL databases.
- **Benefits**: Allows precise control over how entity properties map to database fields, especially when using utilities like `Where` to construct queries.
- **Setup**:
  - Specify `modelFieldMappings` in the `Source` to manually map entity properties to model properties.
  - This approach is necessary if you opt-out of class-based models with decorators.

**Example**:
  ```typescript
  const fieldMappings = {
    customerId: { name: '_id', type: 'ObjectId' },
    customerName: { name: 'name', type: 'string' }
  };

  const customerSource = new MongoSource<CustomerMongoModel>(..., { modelFieldMappings: fieldMappings });
  ```

**Integration with Database Queries**:
- **With Decorators**: Field names should be automatically resolved in queries and the `Where` clauses.
- **Without Decorators**: You must manually ensure that field names in `Where` clauses match those defined in `modelFieldMappings`. If no mappings are defined, the field names used in queries and `Where` must directly correspond to the database field names.

Choosing between class-based and type-based models impacts how you interact with the database in `@soapjs/soap`. Making each suitable for different scenarios and database technologies.

### Transactions
Transactions are used to ensure that a sequence of operations on a database is executed atomically. This means either all operations succeed, or none of them are applied, maintaining data consistency and integrity.

In this framework, transactions can be implemented in the following ways:

1. **Custom Transaction Methods in Repositories**
2. **Transaction Class and TransactionRunner**
3. **Declarative Transactions with Decorators**

[Click here for details](TRANSACTIONS.md)

### Using Inject and Injectable Decorators

The decorators **`@Injectable`** and **`@Inject`** provide a simple, framework-agnostic way to mark classes and class members for dependency injection. By default, **no** actual IoC container is included; instead, you set up your classes with these decorators, and then a **separate adapter** (for NestJS, Inversify, or another DI framework) can interpret the metadata and perform the actual binding/resolution.

[Click here for details](DI.md)

### Service and Toolset
Services are used to communicate with other APIs or any other external data sources (not databases; that's what repositories and collections are for). Toolsets, on the other hand, are categorized sets of tools. Instead of having a general `Utils` or manager, it's a component where you can place any methods that don't fit into other patterns. They can be static or instantiated, and you can obtain them via a container.

```typescript
// Example service abstract class (or interface)
export interface WeatherService {
  static Token = "WeatherService";
  public getWeatherByCity(city: string): Promise<Result<Weather>>;
}

// Example service implementation
class WeatherServiceImpl implements WeatherService {
  constructor(
    private apiKey: string,
    private baseUrl: string) {}

  async getWeatherByCity(city: string): Promise<Result<Weather>> {
    try {
      const response =
        await axios.get(`${this.baseUrl}?q=${city}&appid=${this.apiKey}`);
      return Result.withSuccess(Weather.from(response.data));
    } catch (error) {
      return Result.withFailure(error);
    }
  }
}
// Example data toolset
export class DateToolset {
  static getFirstDayOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }
  
  static getLastDayOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
  }
}
```

## Feeling overwhelmed?

Fear not! We're developing a CLI (Work in Progress) and working on AI for even greater comfort. Stay tuned for more convenience!

## Issues
If you encounter any issues, please feel free to report them [here](https://github.com/soapjs/soap/issues/new/choose).

## Contact
For any questions, collaboration interests, or support needs, you can contact us through the following:

- Official:
  - Email: [contact@soapjs.com](mailto:contact@soapjs.com)
  - Website: http://docs.soapjs.com
- Radoslaw Kamysz:
  - Email: [radoslaw.kamysz@gmail.com](mailto:radoslaw.kamysz@gmail.com)
  - Warpcast: [@k4mr4ad](https://warpcast.com/k4mr4ad)
  - Twitter: [@radoslawkamysz](https://x.com/radoslawkamysz)
## License
SoapJS is licensed under the MIT License.
