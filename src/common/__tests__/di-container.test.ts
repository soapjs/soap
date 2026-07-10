import 'reflect-metadata';
import { DIContainer } from '../di-container';
import { Inject, Injectable } from '../di-decorators';

describe('DIContainer', () => {
  describe('constructor injection', () => {
    it('resolves @Inject tokens when design:paramtypes metadata is absent', () => {
      class ThingService {
        list(): string[] {
          return ['thing'];
        }
      }

      @Injectable()
      class ThingController {
        constructor(@Inject('thingService') public readonly things: ThingService) {}
      }

      Reflect.deleteMetadata('design:paramtypes', ThingController);

      const service = new ThingService();
      const container = new DIContainer();
      container.bind('thingService').toValue(service);
      container.autoRegister(ThingController);

      const controller = container.get<ThingController>('ThingController');

      expect(controller.things).toBe(service);
      expect(controller.things.list()).toEqual(['thing']);
    });

    it('resolves type-based dependencies when design:paramtypes metadata is present', () => {
      class TypeBasedService {
        value = 'resolved-by-type';
      }

      @Injectable()
      class TypeBasedConsumer {
        constructor(public readonly service: TypeBasedService) {}
      }

      const service = new TypeBasedService();
      const container = new DIContainer();
      container.bind(TypeBasedService).toValue(service);
      container.autoRegister(TypeBasedConsumer);

      const consumer = container.get<TypeBasedConsumer>('TypeBasedConsumer');

      expect(consumer.service).toBe(service);
      expect(consumer.service.value).toBe('resolved-by-type');
    });

    it('resolves mixed @Inject tokens and design:paramtypes metadata', () => {
      class FirstDependency {
        value = 'first';
      }

      class SecondDependency {
        value = 'second';
      }

      @Injectable()
      class MixedConsumer {
        constructor(
          @Inject('firstToken') public readonly first: FirstDependency,
          public readonly second: SecondDependency
        ) {}
      }

      const first = new FirstDependency();
      const second = new SecondDependency();
      const container = new DIContainer();
      container.bind('firstToken').toValue(first);
      container.bind(SecondDependency).toValue(second);
      container.autoRegister(MixedConsumer);

      const consumer = container.get<MixedConsumer>('MixedConsumer');

      expect(consumer.first).toBe(first);
      expect(consumer.second).toBe(second);
    });

    it('uses dependencies configured via @Injectable options during auto registration', () => {
      @Injectable({ dependencies: ['manualToken'] })
      class ManualDependencyConsumer {
        constructor(public readonly dependency: unknown) {}
      }

      const dependency = { value: 'manual' };
      const container = new DIContainer();
      container.bind('manualToken').toValue(dependency);
      container.autoRegister(ManualDependencyConsumer);

      const consumer = container.get<ManualDependencyConsumer>('ManualDependencyConsumer');

      expect(consumer.dependency).toBe(dependency);
    });

    it('throws a descriptive error for unresolved constructor parameters', () => {
      @Injectable()
      class BrokenConsumer {
        constructor(public readonly dependency: unknown) {}
      }

      Reflect.deleteMetadata('design:paramtypes', BrokenConsumer);

      const container = new DIContainer();

      expect(() => container.autoRegister(BrokenConsumer)).toThrow(
        'Cannot resolve constructor parameter #0 of BrokenConsumer: no @Inject token and no emitted design:paramtypes.'
      );
    });
  });
});
