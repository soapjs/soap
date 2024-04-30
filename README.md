# SoapJS
## OMG, Yet Another Framework
Yes, we know there are many frameworks out there, and they are excellent. However, there's a gap: separating logic from the framework itself to ease the trouble during migration or framework switching. As backend developers, we often had to rewrite code tailored to specific frameworks. SoapJS, rooted in Clean Architecture, offers customizable code structures through configuration files and presets, allowing you to decide on your code's structure. We provide a solution that can be adapted and applied as preferred, eliminating the need to start from scratch. Our CLI facilitates file generation based on configurations, letting developers focus on writing the actual code.

## Description
**SoapJS** is a framework designed to empower developers by adhering to the principles of Clean Architecture, enhancing modularity and maintainability in web application development.

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
export class Dependencies {
  public async configure() {
    // rest of the components ...
    container
      .bind<CustomerController>(CustomerController.Token)
      .to(CustomerController);
  }
}
```

### Route
A route is an object containing a description, route instructions, and the handler to be invoked upon route activation. A route may also contain options regarding authentication, validation, or request and response mapping. Middleware implementations for these options must be provided by you. To construct a `RouteIO`, use the interface from the `@soapjs/soap` package.

```typescript
export class GetCustomerDetailsRoute {
  static create(handler: RouteHandler) {
    return new GetCustomerDetailsRoute('shop/customers/:id', handler);
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
export class GetCustomerDetailsRouteIO implements RouteIO {
  public toResponse(response: RouteResponse, result: Result<Customer>) {
    if (result.isFailure) {
      // decide on the status type and content
      return response.status(500).send(result.failure.error.message);
    }
    const { ... } = result.content;
    // map result content to output if needed
    return response.status(200).send({...});
  }
  
  public fromRequest(request: Request): string {
    return request.params.id;
  }
}
```

### Router
A router is used to manage routes, or rather, to embed and execute them. The framework and all dependencies must be initialized beforehand to use the router. To add a new route, mount it in the `configure` method as shown below:

```typescript
export class MyRouter extends Soap.Router {
  // Example implementation for an Express-based router
  protected callFrameworkMethod(
    path: string,
    framework: any,
    method: string,
    middlewares: any[],
    handler: (...args: any[]) => any
  ): (...args: any[]) => any {
    return framework[method](path, middlewares, handler);
  }

  public async configure(container: Container) {
    // Example of adding a route to the router:
    const customerController = 
      container.get<CustomerController>(CustomerController.Token);
    
    // Mounting the route with associated controller method:
    this.mount(
      GetCustomerDetailsRoute.create(customerController.getCustomerDetails)
    );
  }
}
```

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
// Example use case class
export class ProcessOrderUseCase {
  static Token = "ProcessOrderUseCase";

  public async execute(
    orderItems: Product[],
    customerDetails: Customer,
    paymentMethod: string,
  ): Promise<Result<OrderConfirmation>> {
    let confirmation: OrderConfirmation;
    // logic ...
    return Result.withContent(confirmation);
  }
}
```
### Repository and RepositoryImpl

Repositories are components that perform operations on databases. They typically use one data context (i.e., database client or specific table), mapper, and query builder. Repositories should handle all data-related logic but not business logic (exceptions may include decisions like caching data). `RepositoryImpl` contains basic implementations and is tailored to using a single data context. If you need custom (dedicated) methods, parameters, or want to use multiple contexts, such as for aggregation, you should write your own implementation, perhaps by extending `RepositoryImpl`. Below are examples of setting up a repository and creating custom ones.

```typescript
// Example repository abstract class (or interface)
export abstract class CustomerRepository<Customer> extends Repository {
  static Token = "CustomerRepository";
  // place for additional methods ...
}

// Example custom repository implementation
export class CustomerRepositoryImpl<Customer> extends RepositoryImpl implements CustomerRepository {
  constructor(
    mongoContext: DataContext<Customer, CustomerMongoModel>,
    // feel free to add more contexts if you need
  ) {
    super(mongoContext);
  }
  // place for additional methods ...
}

// Example setup of repository and creation of custom ones in the Dependencies class
export class Dependencies {
  public async configure() {
    const context = {
      collection: new MongoCollection<CustomerMongoModel>(mongoClient, 'customers'), 
      mapper: new CustomerMongoMapper(),
      queries: new MongoQueryFactory()
    }
    const impl = new CustomerRepositoryImpl(context);
    // OR
    // const impl = new RepositoryImpl(context)
    container
      .bind<CustomerRepository>(CustomerRepository.Token)
      .toConstantValue(new CustomerRepositoryImpl(context));
  }
}
```

### Collection
Collections are components that perform operations directly on a collection or table in the database using a client. To use them, you need a dedicated implementation, like `@soapjs/soap-node-mongo`, or you can write your own, ensuring consistency with the interface.

```typescript
export class CustomerMongoCollection extends MongoCollection<CustomerMongoModel> {
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
Unlike in other frameworks, entities here are used as data containers in the domain layer. They may contain helper methods but should not include mappers to database documents (that's what mappers are for), and they should not directly reference databases. Treat them as data representations in logic, independent of the data source.

```typescript
export class Customer {
  constructor(
    public readonly orders: Order[],
    public readonly address: Address,
    public readonly loyaltyPoints: number) {}
}
```

### Model
Models of database documents are treated as data transfer objects. They contain raw data representations and should only be used in repositories, collections, or services.

```typescript
export class Customer {
  constructor(
    public readonly orders: Order[],
    public readonly address: Address,
    public readonly loyaltyPoints: number) {}
}
```

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
      return Result.withContent(Weather.from(response.data));
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
  - Website: https://soapjs.com
- Radoslaw Kamysz:
  - Email: [radoslaw.kamysz@gmail.com](mailto:radoslaw.kamysz@gmail.com)
  - Warpcast: [@k4mr4ad](https://warpcast.com/k4mr4ad)
  - Twitter: [@radoslawkamysz](https://x.com/radoslawkamysz)
## License
SoapJS is licensed under the MIT License.
