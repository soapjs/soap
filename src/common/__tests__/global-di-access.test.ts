import 'reflect-metadata';
import { Injectable } from '../di-decorators';
import { DI, clear } from '../di-global';

describe('Global DI Access', () => {
  beforeEach(() => {
    clear();
  });

  describe('Global container behavior', () => {
    it('should allow access to all dependencies globally without modules', () => {
      @Injectable()
      class UserRepository {
        findById(id: string) {
          return `User ${id} from repository`;
        }
      }

      @Injectable()
      class OrderRepository {
        findById(id: string) {
          return `Order ${id} from repository`;
        }
      }

      @Injectable()
      class UserService {
        constructor(
          private userRepo: UserRepository,
          private orderRepo: OrderRepository
        ) {}

        getUserWithOrders(userId: string) {
          const user = this.userRepo.findById(userId);
          const orders = this.orderRepo.findById(userId);
          return { user, orders };
        }
      }

      @Injectable()
      class OrderService {
        constructor(
          private userRepo: UserRepository,
          private orderRepo: OrderRepository
        ) {}

        getOrderWithUser(orderId: string) {
          const order = this.orderRepo.findById(orderId);
          const user = this.userRepo.findById(orderId);
          return { order, user };
        }
      }

      // Register all dependencies in global container
      DI.registerClass(UserRepository);
      DI.registerClass(OrderRepository);
      DI.registerClass(UserService);
      DI.registerClass(OrderService);

      // All services can access all dependencies
      const userService = DI.get<UserService>('UserService');
      const orderService = DI.get<OrderService>('OrderService');

      const result1 = userService.getUserWithOrders('123');
      const result2 = orderService.getOrderWithUser('456');

      expect(result1.user).toBe('User 123 from repository');
      expect(result1.orders).toBe('Order 123 from repository');
      expect(result2.order).toBe('Order 456 from repository');
      expect(result2.user).toBe('User 456 from repository');
    });

    it('should work without any module configuration', async () => {
      @Injectable()
      class DatabaseService {
        connect() {
          return 'Connected to database';
        }
      }

      @Injectable()
      class CacheService {
        set(key: string, value: any) {
          return `Cached: ${key} = ${value}`;
        }
      }

      @Injectable()
      class UserService {
        constructor(
          private db: DatabaseService,
          private cache: CacheService
        ) {}

        async getUser(id: string) {
          const cached = this.cache.set(`user-${id}`, `user-${id}`);
          const dbResult = this.db.connect();
          return { cached, dbResult };
        }
      }

      @Injectable()
      class OrderService {
        constructor(
          private db: DatabaseService,
          private cache: CacheService
        ) {}

        async getOrder(id: string) {
          const cached = this.cache.set(`order-${id}`, `order-${id}`);
          const dbResult = this.db.connect();
          return { cached, dbResult };
        }
      }

      // No modules needed - just register everything globally
      DI.registerClass(DatabaseService);
      DI.registerClass(CacheService);
      DI.registerClass(UserService);
      DI.registerClass(OrderService);

      const userService = DI.get<UserService>('UserService');
      const orderService = DI.get<OrderService>('OrderService');

      const userResult = await userService.getUser('123');
      const orderResult = await orderService.getOrder('456');

      expect(userResult.cached).toBe('Cached: user-123 = user-123');
      expect(orderResult.cached).toBe('Cached: order-456 = order-456');
    });

    it('should allow mixing different registration approaches', () => {
      @Injectable()
      class ServiceA {
        getValue() {
          return 'ServiceA';
        }
      }

      @Injectable()
      class ServiceB {
        getValue() {
          return 'ServiceB';
        }
      }

      class ServiceC {
        getValue() {
          return 'ServiceC';
        }
      }

      // Mix different registration approaches
      DI.registerClass(ServiceA);                    // Auto token
      DI.registerClass(ServiceB, 'CustomServiceB');  // Custom token
      DI.registerValue('ServiceC', new ServiceC());  // Value registration
      DI.registerFactory('ServiceD', () => ({ getValue: () => 'ServiceD' })); // Factory

      // All are accessible globally
      const serviceA = DI.get<ServiceA>('ServiceA');
      const serviceB = DI.get<ServiceB>('CustomServiceB');
      const serviceC = DI.get('ServiceC') as any;
      const serviceD = DI.get('ServiceD') as any;

      expect(serviceA.getValue()).toBe('ServiceA');
      expect(serviceB.getValue()).toBe('ServiceB');
      expect(serviceC.getValue()).toBe('ServiceC');
      expect(serviceD.getValue()).toBe('ServiceD');
    });

    it('should show all registered tokens globally', () => {
      @Injectable()
      class Service1 {}
      @Injectable()
      class Service2 {}
      @Injectable()
      class Service3 {}

      DI.registerClass(Service1);
      DI.registerClass(Service2, 'CustomService2');
      DI.registerClass(Service3, Symbol('Service3'));
      DI.registerValue('Config', { port: 3000 });
      DI.registerFactory('Factory', () => ({}));

      const tokens = DI.getTokens();
      
      expect(tokens).toContain('Service1');
      expect(tokens).toContain('CustomService2');
      expect(tokens).toContain('Symbol(Service3)'); // Symbol converted to string
      expect(tokens).toContain('Config');
      expect(tokens).toContain('Factory');
    });
  });

  describe('No module boundaries', () => {
    it('should not require module exports/imports like NestJS', () => {
      // Simulate different "modules" but all in global container
      
      // "User Module"
      @Injectable()
      class UserRepository {
        findById(id: string) {
          return `User ${id}`;
        }
      }

      @Injectable()
      class UserService {
        constructor(private userRepo: UserRepository) {}
        
        getUser(id: string) {
          return this.userRepo.findById(id);
        }
      }

      // "Order Module" 
      @Injectable()
      class OrderRepository {
        findById(id: string) {
          return `Order ${id}`;
        }
      }

      @Injectable()
      class OrderService {
        constructor(
          private orderRepo: OrderRepository,
          private userRepo: UserRepository // Can access UserRepository directly!
        ) {}
        
        getOrderWithUser(orderId: string, userId: string) {
          const order = this.orderRepo.findById(orderId);
          const user = this.userRepo.findById(userId);
          return { order, user };
        }
      }

      // Register everything globally - no module boundaries
      DI.registerClass(UserRepository);
      DI.registerClass(UserService);
      DI.registerClass(OrderRepository);
      DI.registerClass(OrderService);

      // OrderService can access UserRepository without any module configuration
      const orderService = DI.get<OrderService>('OrderService');
      const result = orderService.getOrderWithUser('order-123', 'user-456');

      expect(result.order).toBe('Order order-123');
      expect(result.user).toBe('User user-456');
    });
  });
});
