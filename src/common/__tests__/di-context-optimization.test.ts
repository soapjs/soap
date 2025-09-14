import 'reflect-metadata';
import { Injectable } from '../di-decorators';
import { DI, clear } from '../di-global';

describe('DI Context Optimization', () => {
  beforeEach(() => {
    clear();
  });

  describe('Lazy loading with factories', () => {
    it('should load dependencies only when first accessed', () => {
      let userRepoLoaded = false;
      let userServiceLoaded = false;

      @Injectable()
      class DatabaseService {
        connect() {
          return 'Connected';
        }
      }

      @Injectable()
      class UserRepository {
        constructor(private db: DatabaseService) {}
        
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

      // Register core service immediately
      DI.registerClass(DatabaseService);

      // Register factories for lazy loading
      DI.registerFactory('UserRepository', () => {
        userRepoLoaded = true;
        console.log('Lazy loading UserRepository...');
        return new UserRepository(DI.get('DatabaseService'));
      });

      DI.registerFactory('UserService', () => {
        userServiceLoaded = true;
        console.log('Lazy loading UserService...');
        return new UserService(DI.get('UserRepository'));
      });

      // Nothing should be loaded yet
      expect(userRepoLoaded).toBe(false);
      expect(userServiceLoaded).toBe(false);

      // Access UserService - this should trigger loading
      const userService = DI.get('UserService') as UserService;
      expect(userRepoLoaded).toBe(true);
      expect(userServiceLoaded).toBe(true);

      // Should work normally
      const result = userService.getUser('123');
      expect(result).toBe('User 123');
    });
  });

  describe('Conditional loading', () => {
    it('should load services based on conditions', () => {
      @Injectable()
      class CoreService {
        getValue() {
          return 'core';
        }
      }

      @Injectable()
      class OptionalService {
        getValue() {
          return 'optional';
        }
      }

      @Injectable()
      class PremiumService {
        getValue() {
          return 'premium';
        }
      }

      // Always load core
      DI.registerClass(CoreService);

      // Conditionally load based on environment
      const enableOptional = process.env.ENABLE_OPTIONAL === 'true';
      const enablePremium = process.env.ENABLE_PREMIUM === 'true';

      if (enableOptional) {
        DI.registerClass(OptionalService);
      }

      if (enablePremium) {
        DI.registerClass(PremiumService);
      }

      // Core should always be available
      expect(DI.has('CoreService')).toBe(true);

      // Optional services depend on conditions
      expect(DI.has('OptionalService')).toBe(enableOptional);
      expect(DI.has('PremiumService')).toBe(enablePremium);
    });
  });

  describe('Context-based organization', () => {
    it('should organize dependencies by context', () => {
      // Create contexts for different modules
      DI.createServiceContext('DatabaseService', './services/database.service.ts');
      DI.createServiceContext('CacheService', './services/cache.service.ts');
      
      DI.createRepositoryContext('UserRepository', './repositories/user.repository.ts', ['DatabaseService']);
      DI.createRepositoryContext('OrderRepository', './repositories/order.repository.ts', ['DatabaseService']);
      
      DI.createServiceContext('UserService', './services/user.service.ts', ['UserRepository', 'CacheService']);
      DI.createServiceContext('OrderService', './services/order.service.ts', ['OrderRepository', 'UserRepository']);
      
      DI.createUseCaseContext('CreateUserUseCase', './usecases/create-user.usecase.ts', ['UserService', 'CacheService']);
      
      DI.createControllerContext('UserController', './controllers/user.controller.ts', ['UserService', 'CreateUserUseCase']);

      const contexts = DI.contextManager.getContexts();
      
      // Should have all contexts
      expect(contexts).toHaveLength(8);
      
      // Check context types
      const serviceContexts = contexts.filter(c => c.type === 'service');
      const repositoryContexts = contexts.filter(c => c.type === 'repository');
      const useCaseContexts = contexts.filter(c => c.type === 'usecase');
      const controllerContexts = contexts.filter(c => c.type === 'controller');
      
      expect(serviceContexts).toHaveLength(4); // DatabaseService, CacheService, UserService, OrderService
      expect(repositoryContexts).toHaveLength(2); // UserRepository, OrderRepository
      expect(useCaseContexts).toHaveLength(1); // CreateUserUseCase
      expect(controllerContexts).toHaveLength(1); // UserController
      
      // Check dependencies
      const userServiceContext = contexts.find(c => c.name === 'UserService');
      expect(userServiceContext?.dependencies).toEqual(['UserRepository', 'CacheService']);
      
      const orderServiceContext = contexts.find(c => c.name === 'OrderService');
      expect(orderServiceContext?.dependencies).toEqual(['OrderRepository', 'UserRepository']);
    });
  });

  describe('Module generation', () => {
    it('should generate module code from contexts', () => {
      // Create contexts
      DI.createServiceContext('UserService', './services/user.service.ts', ['UserRepository']);
      DI.createRepositoryContext('UserRepository', './repositories/user.repository.ts', ['DatabaseService']);
      DI.createServiceContext('DatabaseService', './services/database.service.ts');

      // Generate module code
      const moduleCode = DI.generateModuleCode('AppModule');
      
      expect(moduleCode).toContain('AppModuleModule');
      expect(moduleCode).toContain('UserService');
      expect(moduleCode).toContain('UserRepository');
      expect(moduleCode).toContain('DatabaseService');
      expect(moduleCode).toContain('providers:');
      expect(moduleCode).toContain('exports:');
    });

    it('should generate registration code from contexts', () => {
      // Create contexts
      DI.createServiceContext('UserService', './services/user.service.ts');
      DI.createRepositoryContext('UserRepository', './repositories/user.repository.ts');

      // Generate registration code
      const registrationCode = DI.generateRegistrationCode();
      
      expect(registrationCode).toContain('Auto-generated dependency registration');
      expect(registrationCode).toContain('import { container }');
      expect(registrationCode).toContain('UserService');
      expect(registrationCode).toContain('UserRepository');
      expect(registrationCode).toContain('container.bindClass');
    });
  });

  describe('Performance optimization strategies', () => {
    it('should support different scopes for optimization', () => {
      @Injectable()
      class StatelessService {
        getValue() {
          return 'stateless';
        }
      }

      @Injectable()
      class StatefulService {
        private state = 0;
        
        getValue() {
          return ++this.state;
        }
      }

      // Register with appropriate scopes
      DI.registerClass(StatelessService, { scope: 'singleton' as any }); // Reuse instance
      DI.registerClass(StatefulService, { scope: 'transient' as any }); // New instance each time

      const stateless1 = DI.get<StatelessService>('StatelessService');
      const stateless2 = DI.get<StatelessService>('StatelessService');
      
      const stateful1 = DI.get<StatefulService>('StatefulService');
      const stateful2 = DI.get<StatefulService>('StatefulService');

      // Singleton should return same instance
      expect(stateless1).toBe(stateless2);
      
      // Transient should return different instances
      expect(stateful1).not.toBe(stateful2);
      expect(stateful1.getValue()).toBe(1);
      expect(stateful2.getValue()).toBe(1); // Fresh instance
    });

    it('should support factory pattern for expensive operations', () => {
      let expensiveOperationCalled = 0;

      const expensiveOperation = () => {
        expensiveOperationCalled++;
        console.log('Performing expensive operation...');
        return { data: 'expensive-data' };
      };

      // Register factory that performs expensive operation
      DI.registerFactory('ExpensiveService', expensiveOperation);

      // First access should call expensive operation
      const service1 = DI.get('ExpensiveService');
      expect(expensiveOperationCalled).toBe(1);

      // Second access should reuse the result (singleton by default)
      const service2 = DI.get('ExpensiveService');
      expect(expensiveOperationCalled).toBe(1); // Not called again
      expect(service1).toBe(service2); // Same instance
    });
  });
});
