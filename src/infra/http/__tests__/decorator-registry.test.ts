import { DecoratorRegistry } from '../decorator-registry';
import { RouteMetadata, ControllerMetadata } from '../types';

describe('DecoratorRegistry', () => {
  beforeEach(() => {
    DecoratorRegistry.clear();
  });

  describe('Route registration', () => {
    it('should register a route', () => {
      const target = class TestController {};
      const propertyKey = 'testMethod';
      const metadata: RouteMetadata = {
        method: 'GET',
        path: '/test',
        middlewares: [],
      };

      DecoratorRegistry.registerRoute(target, propertyKey, metadata);

      expect(DecoratorRegistry.getRoute(target, propertyKey)).toEqual(metadata);
    });

    it('should return undefined for non-existent route', () => {
      const target = class TestController {};
      expect(DecoratorRegistry.getRoute(target, 'nonExistent')).toBeUndefined();
    });

    it('should get all routes', () => {
      const target1 = class TestController1 {};
      const target2 = class TestController2 {};
      const metadata1: RouteMetadata = {
        method: 'GET',
        path: '/test1',
        middlewares: [],
      };
      const metadata2: RouteMetadata = {
        method: 'POST',
        path: '/test2',
        middlewares: [],
      };

      DecoratorRegistry.registerRoute(target1, 'method1', metadata1);
      DecoratorRegistry.registerRoute(target2, 'method2', metadata2);

      const routes = DecoratorRegistry.getRoutes();
      expect(routes.size).toBe(2);
      expect(routes.get('TestController1.method1')).toEqual(metadata1);
      expect(routes.get('TestController2.method2')).toEqual(metadata2);
    });
  });

  describe('Controller registration', () => {
    it('should register a controller', () => {
      const target = class TestController {};
      const metadata: ControllerMetadata = {
        basePath: '/api',
        middlewares: [],
        type: 'http',
      };

      DecoratorRegistry.registerController(target, metadata);

      expect(DecoratorRegistry.getController(target)).toEqual(metadata);
    });

    it('should clear all routes and controllers', () => {
      const target = class TestController {};
      DecoratorRegistry.registerRoute(target, 'method', {
        method: 'GET',
        path: '/test',
        middlewares: [],
      });
      DecoratorRegistry.registerController(target, {
        basePath: '/api',
        middlewares: [],
        type: 'http',
      });

      expect(DecoratorRegistry.getRoutes().size).toBe(1);
      expect(DecoratorRegistry.getControllers().size).toBe(1);

      DecoratorRegistry.clear();

      expect(DecoratorRegistry.getRoutes().size).toBe(0);
      expect(DecoratorRegistry.getControllers().size).toBe(0);
    });
  });
});
