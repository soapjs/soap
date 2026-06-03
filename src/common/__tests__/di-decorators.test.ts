import 'reflect-metadata';
import { Injectable, Inject, getInjectableMetadata, getInjectMetadata, getParamTypes } from '../di-decorators';

// Access the private constant for testing
const INJECT_METADATA_KEY = 'soap:inject';

describe('DI Decorators', () => {
  describe('@Injectable', () => {
    it('should mark a class as injectable with default options', () => {
      @Injectable()
      class TestService {}

      const metadata = getInjectableMetadata(TestService);
      expect(metadata).toEqual({
        token: 'TestService',
        scope: 'singleton',
        factory: undefined,
        dependencies: []
      });
    });

    it('should mark a class as injectable with custom options', () => {
      @Injectable({ scope: 'transient' as any, token: 'CustomToken' })
      class TestService {}

      const metadata = getInjectableMetadata(TestService);
      expect(metadata).toEqual({
        token: 'CustomToken',
        scope: 'transient',
        factory: undefined,
        dependencies: []
      });
    });

    it('should store parameter types metadata', () => {
      class Dependency {}
      
      @Injectable()
      class TestService {
        constructor(dep: Dependency) {}
      }

      const paramTypes = getParamTypes(TestService);
      expect(paramTypes).toHaveLength(1);
      expect(paramTypes[0]).toBe(Dependency);
    });
  });

  describe('@Inject', () => {
    it('should mark a property for injection', () => {
      class TestService {
        @Inject('DependencyToken')
        private dependency!: any;
      }

      const metadata = getInjectMetadata(TestService);
      expect(metadata).toEqual({
        dependency: 'DependencyToken'
      });
    });

    it('should mark multiple properties for injection', () => {
      class TestService {
        @Inject('Token1')
        private dep1!: any;

        @Inject('Token2')
        private dep2!: any;
      }

      const metadata = getInjectMetadata(TestService);
      expect(metadata).toEqual({
        dep1: 'Token1',
        dep2: 'Token2'
      });
    });
  });

  describe('@Inject for constructor parameters', () => {
    it('should store parameter tokens per-class without leaking into Object.prototype', () => {
      // Regression test for the "constructor as metadata key" trap:
      // a plain object literal already has an inherited `.constructor`
      // property pointing at `Object`, so a naive
      //   if (!existingTokens.constructor) existingTokens.constructor = []
      // guard always falls through and `existingTokens.constructor[i] = token`
      // ends up assigning to the global `Object` constructor. Two classes
      // declared in the same process would then share (and clobber) tokens.

      class A {
        constructor(@Inject('TokenA0') _a0: unknown, @Inject('TokenA1') _a1: unknown) {}
      }
      class B {
        constructor(@Inject('TokenB0') _b0: unknown, @Inject('TokenB1') _b1: unknown) {}
      }

      const a = getInjectMetadata(A);
      const b = getInjectMetadata(B);

      expect(a?.parameters).toEqual(['TokenA0', 'TokenA1']);
      expect(b?.parameters).toEqual(['TokenB0', 'TokenB1']);

      // The metadata buckets must NOT be the same array (no cross-class leakage)
      expect(a?.parameters).not.toBe(b?.parameters);

      // And nothing leaked onto the global Object constructor.
      expect((Object as any)[0]).not.toBe('TokenA0');
      expect((Object as any)[0]).not.toBe('TokenB0');
    });
  });

  describe('Metadata helpers', () => {
    it('should return undefined for non-injectable classes', () => {
      class RegularClass {}

      const metadata = getInjectableMetadata(RegularClass);
      expect(metadata).toBeUndefined();
    });

    it('should return undefined for classes without inject metadata', () => {
      class RegularClass {
        private prop: any;
      }

      const metadata = getInjectMetadata(RegularClass);
      expect(metadata).toBeUndefined();
    });

    it('should return empty array for classes without parameter types', () => {
      class RegularClass {}

      const paramTypes = getParamTypes(RegularClass);
      expect(paramTypes).toEqual([]);
    });
  });
});
