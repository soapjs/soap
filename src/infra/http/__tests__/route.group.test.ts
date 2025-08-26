import { Route } from "../route";
import { RouteGroup } from "../route.group";

describe("RouteGroup", () => {
  const mockHandler = jest.fn();

  it("should create a group with a base path", () => {
    const group = new RouteGroup("/api");

    expect(group.path).toBe("/api");
    expect(group.routes.length).toBe(0);
  });

  it("should add a route to the group and inherit the base path", () => {
    const group = new RouteGroup("/api");
    const route = new Route("GET", "/users", mockHandler);

    group.add(route);

    expect(group.routes.length).toBe(1);
    expect(group.routes[0].path).toEqual(["/api/users"]);
    expect(group.routes[0].method).toBe("GET");
  });

  it("should properly append multiple routes and inherit base path", () => {
    const group = new RouteGroup("/api");
    group.add(new Route("GET", "/users", mockHandler));
    group.add(new Route("POST", "/users", mockHandler));

    expect(group.routes.length).toBe(2);
    expect(group.routes[0].path).toEqual(["/api/users"]);
    expect(group.routes[1].path).toEqual(["/api/users"]);
  });

  it("should correctly apply additional options to all routes in the group", () => {
    const options = {
      cors: { origin: "*" },
      security: { contentSecurityPolicy: false },
    };
    const group = new RouteGroup("/api", options);

    group.add(new Route("GET", "/users", mockHandler));

    expect(group.routes[0].options).toEqual(options);
  });

  it("should merge individual route options with group options", () => {
    const groupOptions = { cors: { origin: "*" } };
    const routeOptions = { security: { contentSecurityPolicy: false } };
    const group = new RouteGroup("/api", groupOptions);

    group.add(new Route("GET", "/users", mockHandler, routeOptions));

    expect(group.routes[0].options).toEqual({
      ...groupOptions,
      ...routeOptions,
    });
  });

  it("should handle an array of paths", () => {
    const group = new RouteGroup("/api");
    group.add(new Route("GET", ["/users", "/admins"], mockHandler));

    expect(group.routes.length).toBe(1);
    expect(group.routes[0].path).toEqual(["/api/users", "/api/admins"]);
  });
});
