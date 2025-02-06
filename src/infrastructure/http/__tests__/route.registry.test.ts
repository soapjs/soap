import { Route } from "../route";
import { RouteGroup } from "../route.group";
import { RouteRegistry } from "../route.registry";

describe("RouteRegistry", () => {
  const mockHandler = jest.fn();
  const registry = new RouteRegistry();
  beforeEach(() => {
    registry.clear();
  });

  it("should register a single route", () => {
    const route = new Route("GET", "/users", mockHandler);
    registry.register(route);

    const registeredRoute = registry.getRoute('GET', "/users");

    expect(registeredRoute).toBeDefined();
    expect(registeredRoute?.path).toBe("/users");
    expect(registeredRoute?.method).toBe("GET");
    expect(registry.getAllRoutes()).toHaveLength(1);
  });

  it("should register multiple routes", () => {
    registry.register(new Route("GET", "/users", mockHandler));
    registry.register(new Route("POST", "/users", mockHandler));

    expect(registry.getAllRoutes()).toHaveLength(2);
  });

  it("should register a route group and store its routes", () => {
    const group = new RouteGroup("/api");
    group.add(new Route("GET", "/users", mockHandler));
    group.add(new Route("POST", "/users", mockHandler));

    registry.register(group);

    expect(registry.getAllGroups()).toHaveLength(1);
    expect(registry.getAllRoutes()).toHaveLength(2);

    const registeredGroup = registry.getGroup("/api");
    expect(registeredGroup).toBeDefined();
    expect(registeredGroup?.routes).toHaveLength(2);
  });

  it("should retrieve a registered route", () => {
    const route = new Route("GET", "/users", mockHandler);
    registry.register(route);

    const retrievedRoute = registry.getRoute('GET', "/users");

    expect(retrievedRoute).toBeDefined();
    expect(retrievedRoute?.path).toBe("/users");
    expect(retrievedRoute?.method).toBe("GET");
  });

  it("should retrieve a registered route group", () => {
    const group = new RouteGroup("/api");
    group.add(new Route("GET", "/users", mockHandler));

    registry.register(group);

    const retrievedGroup = registry.getGroup("/api");

    expect(retrievedGroup).toBeDefined();
    expect(retrievedGroup?.routes).toHaveLength(1);
    expect(retrievedGroup?.routes[0].path).toEqual(["/api/users"]);
  });

  it("should handle duplicate routes", () => {
    const route1 = new Route("GET", "/users", mockHandler);
    const route2 = new Route("GET", "/users", mockHandler);

    registry.register(route1);
    registry.register(route2);

    expect(registry.getAllRoutes()).toHaveLength(1);
  });

  it("should handle duplicate route groups", () => {
    const group1 = new RouteGroup("/api");
    group1.add(new Route("GET", "/users", mockHandler));

    const group2 = new RouteGroup("/api");
    group2.add(new Route("POST", "/users", mockHandler));

    registry.register(group1);
    registry.register(group2);

    expect(registry.getAllGroups()).toHaveLength(1);
    expect(registry.getAllRoutes()).toHaveLength(2);
  });

  it("should return undefined for non-existent routes", () => {
    expect(registry.getRoute('GET', "/non-existent")).toBeUndefined();
  });

  it("should return undefined for non-existent route groups", () => {
    expect(registry.getGroup("/non-existent")).toBeUndefined();
  });

  it("should clear all registered routes and groups", () => {
    registry.register(new Route("GET", "/users", mockHandler));
    registry.register(new RouteGroup("/api"));

    registry.clear();

    expect(registry.getAllRoutes()).toHaveLength(0);
    expect(registry.getAllGroups()).toHaveLength(0);
  });
});
