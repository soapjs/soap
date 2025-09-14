import 'reflect-metadata';
import { Injectable } from '../di-decorators';
import { DI, clear } from '../di-global';
import { Scope } from '../di-types';

describe('DI Scopes', () => {
  beforeEach(() => {
    clear();
  });

  describe('SINGLETON scope', () => {
    it('should return the same instance for singleton scope', () => {
      @Injectable()
      class SingletonService {
        public id = Math.random();
      }

      DI.registerClass(SingletonService, { scope: Scope.SINGLETON });
      
      const instance1 = DI.get<SingletonService>('SingletonService');
      const instance2 = DI.get<SingletonService>('SingletonService');
      
      expect(instance1).toBe(instance2); // Same instance
      expect(instance1.id).toBe(instance2.id); // Same ID
    });

    it('should use singleton as default scope', () => {
      @Injectable()
      class DefaultService {
        public id = Math.random();
      }

      DI.registerClass(DefaultService); // No scope specified
      
      const instance1 = DI.get<DefaultService>('DefaultService');
      const instance2 = DI.get<DefaultService>('DefaultService');
      
      expect(instance1).toBe(instance2); // Same instance (default is singleton)
    });
  });

  describe('TRANSIENT scope', () => {
    it('should return different instances for transient scope', () => {
      @Injectable()
      class TransientService {
        public id = Math.random();
      }

      DI.registerClass(TransientService, { scope: Scope.TRANSIENT });
      
      const instance1 = DI.get<TransientService>('TransientService');
      const instance2 = DI.get<TransientService>('TransientService');
      
      expect(instance1).not.toBe(instance2); // Different instances
      expect(instance1.id).not.toBe(instance2.id); // Different IDs
    });
  });

  describe('REQUEST scope', () => {
    it('should treat request scope as transient for now', () => {
      @Injectable()
      class RequestService {
        public id = Math.random();
      }

      DI.registerClass(RequestService, { scope: Scope.REQUEST });
      
      const instance1 = DI.get<RequestService>('RequestService');
      const instance2 = DI.get<RequestService>('RequestService');
      
      // Request scope is currently treated as transient
      expect(instance1).not.toBe(instance2); // Different instances
      expect(instance1.id).not.toBe(instance2.id); // Different IDs
    });
  });

  describe('Mixed scopes', () => {
    it('should handle different scopes for different services', () => {
      @Injectable()
      class SingletonService {
        public id = Math.random();
      }

      @Injectable()
      class TransientService {
        public id = Math.random();
      }

      DI.registerClass(SingletonService, { scope: Scope.SINGLETON });
      DI.registerClass(TransientService, { scope: Scope.TRANSIENT });
      
      // Singleton should return same instance
      const singleton1 = DI.get<SingletonService>('SingletonService');
      const singleton2 = DI.get<SingletonService>('SingletonService');
      expect(singleton1).toBe(singleton2);
      
      // Transient should return different instances
      const transient1 = DI.get<TransientService>('TransientService');
      const transient2 = DI.get<TransientService>('TransientService');
      expect(transient1).not.toBe(transient2);
    });
  });

  describe('Scope with dependencies', () => {
    it('should respect scope for services with dependencies', () => {
      @Injectable()
      class Dependency {
        public id = Math.random();
      }

      @Injectable()
      class TransientService {
        constructor(public dep: Dependency) {}
      }

      // Register dependency as singleton
      DI.registerClass(Dependency, { scope: Scope.SINGLETON });
      // Register service as transient
      DI.registerClass(TransientService, { scope: Scope.TRANSIENT });
      
      const service1 = DI.get<TransientService>('TransientService');
      const service2 = DI.get<TransientService>('TransientService');
      
      // Service instances should be different
      expect(service1).not.toBe(service2);
      
      // But dependency should be the same (singleton)
      expect(service1.dep).toBe(service2.dep);
      expect(service1.dep.id).toBe(service2.dep.id);
    });
  });

  describe('Scope with factory', () => {
    it('should respect scope for factory providers', () => {
      let factoryCallCount = 0;
      
      const factory = () => {
        factoryCallCount++;
        return { id: Math.random(), callCount: factoryCallCount };
      };

      // Register factory as singleton
      DI.registerFactory('SingletonFactory', factory, { scope: Scope.SINGLETON });
      // Register factory as transient
      DI.registerFactory('TransientFactory', factory, { scope: Scope.TRANSIENT });
      
      // Singleton factory should be called only once
      const singleton1 = DI.get('SingletonFactory') as any;
      const singleton2 = DI.get('SingletonFactory') as any;
      expect(singleton1).toBe(singleton2);
      expect(singleton1.callCount).toBe(1);
      
      // Transient factory should be called multiple times
      const transient1 = DI.get('TransientFactory') as any;
      const transient2 = DI.get('TransientFactory') as any;
      expect(transient1).not.toBe(transient2);
      expect(transient1.callCount).toBe(2);
      expect(transient2.callCount).toBe(3);
    });
  });
});
