import 'reflect-metadata';
import { Injectable } from '../di-decorators';
import { DI, clear } from '../di-global';

describe('DI Namespace', () => {
  beforeEach(() => {
    // Clear the container before each test
    clear();
  });

  describe('registerClass overloads', () => {
    it('should register class with auto token (new API)', () => {
      @Injectable()
      class TestService {
        getValue() {
          return 'test';
        }
      }

      DI.registerClass(TestService);
      
      const instance = DI.get<TestService>('TestService');
      expect(instance).toBeInstanceOf(TestService);
      expect(instance.getValue()).toBe('test');
    });

    it('should register class with custom string token (new API)', () => {
      @Injectable()
      class TestService {
        getValue() {
          return 'test';
        }
      }

      DI.registerClass(TestService, 'CustomToken');
      
      const instance = DI.get<TestService>('CustomToken');
      expect(instance).toBeInstanceOf(TestService);
      expect(instance.getValue()).toBe('test');
    });

    it('should register class with symbol token (new API)', () => {
      @Injectable()
      class TestService {
        getValue() {
          return 'test';
        }
      }

      const token = Symbol('TestService');
      DI.registerClass(TestService, token);
      
      const instance = DI.get<TestService>(token.toString());
      expect(instance).toBeInstanceOf(TestService);
      expect(instance.getValue()).toBe('test');
    });

    it('should register class with options (new API)', () => {
      @Injectable()
      class TestService {}

      DI.registerClass(TestService, { scope: 'transient' as any });
      
      const instance1 = DI.get<TestService>('TestService');
      const instance2 = DI.get<TestService>('TestService');
      
      expect(instance1).not.toBe(instance2); // Different instances for transient
    });

    it('should maintain legacy API compatibility', () => {
      @Injectable()
      class TestService {
        getValue() {
          return 'legacy';
        }
      }

      // Legacy API: registerClass(token, constructor, options?)
      DI.registerClass('LegacyService', TestService);
      
      const instance = DI.get<TestService>('LegacyService');
      expect(instance).toBeInstanceOf(TestService);
      expect(instance.getValue()).toBe('legacy');
    });
  });

  describe('DI namespace functionality', () => {
    it('should provide all DI operations', () => {
      expect(typeof DI.registerClass).toBe('function');
      expect(typeof DI.registerValue).toBe('function');
      expect(typeof DI.registerFactory).toBe('function');
      expect(typeof DI.autoRegister).toBe('function');
      expect(typeof DI.get).toBe('function');
      expect(typeof DI.has).toBe('function');
      expect(typeof DI.clear).toBe('function');
      expect(typeof DI.getTokens).toBe('function');
      expect(typeof DI.help).toBe('function');
    });

    it('should provide container and contextManager access', () => {
      expect(DI.container).toBeDefined();
      expect(DI.contextManager).toBeDefined();
    });

    it('should show help when called', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      DI.help();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('SOAP DI Tool - Available Operations')
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('integration with other DI operations', () => {
    it('should work with registerValue', () => {
      const testValue = { value: 'test' };
      
      DI.registerValue('TestValue', testValue);
      
      const retrieved = DI.get('TestValue');
      expect(retrieved).toBe(testValue);
    });

    it('should work with registerFactory', () => {
      const factory = () => ({ created: true });
      
      DI.registerFactory('TestFactory', factory);
      
      const instance = DI.get('TestFactory');
      expect(instance).toEqual({ created: true });
    });

    it('should work with has and getTokens', () => {
      @Injectable()
      class TestService {}
      
      DI.registerClass(TestService);
      
      expect(DI.has('TestService')).toBe(true);
      expect(DI.has('NonExistent')).toBe(false);
      expect(DI.getTokens()).toContain('TestService');
    });
  });

  describe('constructor injection with new API', () => {
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

      DI.registerClass(Dependency);
      DI.registerClass(Service);
      
      const service = DI.get<Service>('Service');
      expect(service.getValue()).toBe('dependency');
    });

    it('should work with custom tokens', () => {
      @Injectable()
      class Dependency {
        getValue() {
          return 'custom-dependency';
        }
      }

      @Injectable()
      class Service {
        constructor(private dep: Dependency) {}

        getValue() {
          return this.dep.getValue();
        }
      }

      // Register with custom tokens
      DI.registerClass(Dependency, 'CustomDep');
      DI.registerClass(Service, 'CustomService');
      
      // The issue is that Service constructor expects Dependency by type name
      // but we registered it as 'CustomDep'. We need to register it with both names
      DI.registerClass(Dependency); // Register with type name too
      
      const service = DI.get<Service>('CustomService');
      expect(service.getValue()).toBe('custom-dependency');
    });
  });
});
