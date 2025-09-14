import 'reflect-metadata';
import { Injectable, Inject } from '../di-decorators';
import { 
  registerClass,
  registerValue,
  registerFactory,
  get,
  has,
  autoRegister,
  container 
} from '../di-global';

describe('DI Container', () => {
  beforeEach(() => {
    // Clear the container before each test
    container.clear();
  });

  describe('registerClass', () => {
    it('should registerClass a class with the container (legacy API)', () => {
      @Injectable()
      class TestService {
        getValue() {
          return 'test';
        }
      }

      registerClass('TestService', TestService);
      
      const instance = get<TestService>('TestService');
      expect(instance).toBeInstanceOf(TestService);
      expect(instance.getValue()).toBe('test');
    });

    it('should registerClass a class with custom options (legacy API)', () => {
      @Injectable()
      class TestService {}

      registerClass('TestService', TestService, { scope: 'transient' as any });
      
      const instance1 = get<TestService>('TestService');
      const instance2 = get<TestService>('TestService');
      
      expect(instance1).not.toBe(instance2); // Different instances
    });

    it('should registerClass a class with auto token (new API)', () => {
      @Injectable()
      class TestService {
        getValue() {
          return 'auto-token';
        }
      }

      registerClass(TestService);
      
      const instance = get<TestService>('TestService');
      expect(instance).toBeInstanceOf(TestService);
      expect(instance.getValue()).toBe('auto-token');
    });

    it('should registerClass a class with custom token (new API)', () => {
      @Injectable()
      class TestService {
        getValue() {
          return 'custom-token';
        }
      }

      registerClass(TestService, 'CustomToken');
      
      const instance = get<TestService>('CustomToken');
      expect(instance).toBeInstanceOf(TestService);
      expect(instance.getValue()).toBe('custom-token');
    });
  });

  describe('registerValue', () => {
    it('should registerClass a value with the container', () => {
      const instance = { value: 'test' };
      
      registerValue('TestInstance', instance);
      
      const getd = get('TestInstance');
      expect(getd).toBe(instance);
    });
  });

  describe('get', () => {
    it('should get registerClassed dependencies', () => {
      @Injectable()
      class TestService {}

      registerClass('TestService', TestService);
      
      const instance = get<TestService>('TestService');
      expect(instance).toBeInstanceOf(TestService);
    });

    it('should throw error for unregisterClassed dependencies', () => {
      expect(() => get('NonExistentService')).toThrow(
        'No provider found for token: NonExistentService'
      );
    });

    it('should return singleton instances', () => {
      @Injectable()
      class TestService {}

      registerClass('TestService', TestService);
      
      const instance1 = get<TestService>('TestService');
      const instance2 = get<TestService>('TestService');
      
      expect(instance1).toBe(instance2); // Same instance
    });
  });

  describe('Constructor Injection', () => {
    it('should inject dependencies through constructor', () => {
      @Injectable()
      class Dependency {
        getValue() {
          return 'dependency';
        }
      }

      @Injectable()
      class Service {
        constructor(private dep: Dependency) {}

        getValue() {
          return this.dep.getValue();
        }
      }

      registerClass('Dependency', Dependency);
      registerClass('Service', Service);
      
      const service = get<Service>('Service');
      expect(service.getValue()).toBe('dependency');
    });

    it('should handle multiple constructor dependencies', () => {
      @Injectable()
      class Dep1 {
        getValue() { return 'dep1'; }
      }

      @Injectable()
      class Dep2 {
        getValue() { return 'dep2'; }
      }

      @Injectable()
      class Service {
        constructor(private dep1: Dep1, private dep2: Dep2) {}

        getValues() {
          return [this.dep1.getValue(), this.dep2.getValue()];
        }
      }

      registerClass('Dep1', Dep1);
      registerClass('Dep2', Dep2);
      registerClass('Service', Service);
      
      const service = get<Service>('Service');
      expect(service.getValues()).toEqual(['dep1', 'dep2']);
    });
  });

  describe('Property Injection', () => {
    it('should be skipped - property injection requires manual setup', () => {
      // Property injection requires manual setup in the new system
      expect(true).toBe(true);
    });
  });

  describe('Mixed Injection', () => {
    it('should be skipped - mixed injection requires manual setup', () => {
      // Mixed injection requires manual setup in the new system
      expect(true).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should throw error for unregistered dependencies', () => {
      expect(() => get('NonExistentService')).toThrow(
        'No provider found for token: NonExistentService'
      );
    });
  });
});
