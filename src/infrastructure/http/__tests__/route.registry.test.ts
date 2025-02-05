import { Route } from "../route";
import { RouteGroup } from "../route.group";
import { RouteRegistry } from "../route.registry";

describe("RouteRegistry", () => {
  const mockHandler = jest.fn();

  beforeEach(() => {
    RouteRegistry.clear();
  });

  it("should register a single route", () => {
    const route = new Route("GET", "/users", mockHandler);
    RouteRegistry.register(route);

    const registeredRoute = RouteRegistry.getRoute('GET', "/users");

    expect(registeredRoute).toBeDefined();
    expect(registeredRoute?.path).toBe("/users");
    expect(registeredRoute?.method).toBe("GET");
    expect(RouteRegistry.getAllRoutes()).toHaveLength(1);
  });

  it("should register multiple routes", () => {
    RouteRegistry.register(new Route("GET", "/users", mockHandler));
    RouteRegistry.register(new Route("POST", "/users", mockHandler));

    expect(RouteRegistry.getAllRoutes()).toHaveLength(2);
  });

  it("should register a route group and store its routes", () => {
    const group = new RouteGroup("/api");
    group.add(new Route("GET", "/users", mockHandler));
    group.add(new Route("POST", "/users", mockHandler));

    RouteRegistry.register(group);

    expect(RouteRegistry.getAllGroups()).toHaveLength(1);
    expect(RouteRegistry.getAllRoutes()).toHaveLength(2);

    const registeredGroup = RouteRegistry.getGroup("/api");
    expect(registeredGroup).toBeDefined();
    expect(registeredGroup?.routes).toHaveLength(2);
  });

  it("should retrieve a registered route", () => {
    const route = new Route("GET", "/users", mockHandler);
    RouteRegistry.register(route);

    const retrievedRoute = RouteRegistry.getRoute('GET', "/users");

    expect(retrievedRoute).toBeDefined();
    expect(retrievedRoute?.path).toBe("/users");
    expect(retrievedRoute?.method).toBe("GET");
  });

  it("should retrieve a registered route group", () => {
    const group = new RouteGroup("/api");
    group.add(new Route("GET", "/users", mockHandler));

    RouteRegistry.register(group);

    const retrievedGroup = RouteRegistry.getGroup("/api");

    expect(retrievedGroup).toBeDefined();
    expect(retrievedGroup?.routes).toHaveLength(1);
    expect(retrievedGroup?.routes[0].path).toEqual(["/api/users"]);
  });

  it("should handle duplicate routes", () => {
    const route1 = new Route("GET", "/users", mockHandler);
    const route2 = new Route("GET", "/users", mockHandler);

    RouteRegistry.register(route1);
    RouteRegistry.register(route2);

    expect(RouteRegistry.getAllRoutes()).toHaveLength(1);
  });

  it("should handle duplicate route groups", () => {
    const group1 = new RouteGroup("/api");
    group1.add(new Route("GET", "/users", mockHandler));

    const group2 = new RouteGroup("/api");
    group2.add(new Route("POST", "/users", mockHandler));

    RouteRegistry.register(group1);
    RouteRegistry.register(group2);

    expect(RouteRegistry.getAllGroups()).toHaveLength(1);
    expect(RouteRegistry.getAllRoutes()).toHaveLength(2);
  });

  it("should return undefined for non-existent routes", () => {
    expect(RouteRegistry.getRoute('GET', "/non-existent")).toBeUndefined();
  });

  it("should return undefined for non-existent route groups", () => {
    expect(RouteRegistry.getGroup("/non-existent")).toBeUndefined();
  });

  it("should clear all registered routes and groups", () => {
    RouteRegistry.register(new Route("GET", "/users", mockHandler));
    RouteRegistry.register(new RouteGroup("/api"));

    RouteRegistry.clear();

    expect(RouteRegistry.getAllRoutes()).toHaveLength(0);
    expect(RouteRegistry.getAllGroups()).toHaveLength(0);
  });
});
