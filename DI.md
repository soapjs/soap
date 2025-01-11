# **Dependency Injection decorators: Comprehensive Guide**

The decorators **`@Injectable`** and **`@Inject`** provide a simple, framework-agnostic way to mark classes and class members for dependency injection. By default, **no** actual IoC container is included; instead, you set up your classes with these decorators, and then a **separate adapter** (for NestJS, Inversify, or another DI framework) can interpret the metadata and perform the actual binding/resolution.

## Benefits

- **Framework Agnostic**: Your domain logic doesn’t need to depend on a specific container (like Nest’s `@nestjs/common` or Inversify’s `@injectable`).  
- **Reusable**: By using our decorators, you can write your code once and then plug it into whichever container or environment you prefer (e.g., NestJS or Inversify) via an **adapter**.  
- **Maintainable**: If you decide to switch DI frameworks later, you don’t have to rewrite all your annotations. You only change or add a new adapter layer.

## `@Injectable` – Marking a Class for DI

### Basic Usage

```ts
import { Injectable } from "@soapjs/soap";

/**
 * Simple service or use case
 */
@Injectable()
export class UserService {
  public createUser(name: string) {
    console.log(`Creating user: ${name}`);
  }
}
```

- By default, if you do `@Injectable()` with **no arguments**, the DI container can fall back to using the class name (`"UserService"`) as the token/identifier.
- You can **optionally** provide a custom **identifier** and **options**:

```ts
@Injectable("CustomUserService", { scope: "singleton", tags: ["service"] })
export class UserService {
  // ...
}
```

Here, we store metadata like:
- `id`: `"CustomUserService"`
- `scope`: `"singleton"`
- `tags`: `["service"]`

A DI adapter can look up this metadata and decide how to bind the class (e.g., in a singleton scope, with the given token, etc.).

## `@Inject` – Injecting Dependencies

### Property Injection

```ts
import { Inject } from "@soapjs/soap";

@Injectable() 
export class OrderService {
  @Inject("UserService")
  private userService: any; // The adapter will wire up an actual instance

  public createOrder(customerName: string) {
    // Use userService to create the user if needed, etc.
    this.userService.createUser(customerName);
    console.log("Order created!");
  }
}
```

1. We decorate a **property** with `@Inject("UserService")`.  
2. Metadata is stored that says “In this class, the `userService` property requires the token `"UserService"`.”  
3. An adapter (Inversify, Nest, etc.) reads this metadata at runtime and injects the correct instance.

### Constructor Injection

```ts
@Injectable()
export class OrderService {
  constructor(@Inject("UserRepository") private userRepo: any) {}

  public createOrder(customerName: string) {
    const newUser = this.userRepo.save({ name: customerName });
    console.log("Order for user", newUser, "created!");
  }
}
```

- In this case, we decorate the **constructor parameter** with `@Inject("UserRepository")`.
- The metadata indicates that parameter index `0` requires the token `"UserRepository"`.

### Fallback Token

If you do `@Inject()` **without specifying** a token, the decorator will **fallback** to a default. For constructor parameters, it might be the **class name**; for properties, it might be the **property key**. This is optional and depends on your project’s chosen convention.

## Integration

This library **does not** provide direct integration with a container by default. Instead, we provide **adapters** in separate packages:

- **`@soapjs/soap-inversify`** – An adapter that reads `@Injectable` / `@Inject` metadata and converts it into Inversify’s `@injectable`, `@inject`, or container bindings.  
- **`@soapjs/soap-nestjs`** – A NestJS adapter that decorates classes with `@Injectable()` from `@nestjs/common` or dynamically registers them with the Nest container.

> **Why separate packages?**  
> This separation keeps your **domain logic** and **core services** free from any specific DI framework. You only pull in the adapter library that matches your preferred container. If you ever switch frameworks, you change (or add) an adapter without modifying your domain classes.

### Example with Inversify (using `@soapjs/soap-inversify`)

```ts
// Suppose we have a container-setup.ts
import { Container } from "inversify";
import { adaptSoapDecoratorsToInversify } from "@soapjs/soap-inversify";

// Our domain classes using soapjs decorators
import { UserService } from "../services/UserService"; 
import { OrderService } from "../services/OrderService";

export const container = new Container();

// Convert @Injectable / @Inject metadata to Inversify equivalents
adaptSoapDecoratorsToInversify(UserService);
adaptSoapDecoratorsToInversify(OrderService);

// Now we can bind them if needed, or rely on auto-binding logic
// e.g. container.bind("UserService").to(UserService);
```

### Example with NestJS (using `@soapjs/soap-nestjs`)

```ts
// Suppose we have a MyModule.ts
import { Module } from "@nestjs/common";
import { adaptSoapDecoratorsToNest } from "@soapjs/soap-nestjs";

import { UserService } from "../services/UserService";
import { OrderService } from "../services/OrderService";

@Module({
  providers: [
    adaptSoapDecoratorsToNest(UserService),
    adaptSoapDecoratorsToNest(OrderService),
  ],
  exports: [UserService, OrderService],
})
export class MyModule {}
```

- The `adaptSoapDecoratorsToNest` function reads the `@Injectable` / `@Inject` metadata from your classes and applies NestJS `@Injectable()` or dynamic providers.

## Common Patterns and Tips

1. **Prefer Constructor Injection** for new code – it’s often considered more testable and explicit.  
2. **Use Property Injection** in places where you cannot modify the constructor or where dependencies are optional.  
3. **Avoid Coupling**: Keep `@soapjs/soap` usage in your domain and application layers. The actual container logic (e.g. Nest or Inversify) can remain in an **infrastructure** or **bootstrapping** layer.  
4. **Custom Scopes or Tags**: If you pass additional options to `@Injectable`, your adapter can interpret them to register the class as a singleton, transient, or request-scoped.  
5. **Testing**: You can mock out or skip the adapter in tests if you just want to instantiate classes normally. You only need the adapter if you want to test end-to-end DI behavior.
