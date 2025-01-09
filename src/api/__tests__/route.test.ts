import { Result } from "../../architecture";
import {
  Route,
  GetRoute,
  PostRoute,
  PatchRoute,
  PutRoute,
  DeleteRoute,
} from "../route";

describe("Routes", () => {
  const handler = () => Result.withSuccess();
  const options: any = { middleware: [] };
  describe("Route", () => {
    it("should create a new Route instance", () => {
      const route = new Route("GET", "/path", handler, options);

      expect(route.method).toBe("GET");
      expect(route.path).toBe("/path");
      expect(route.handler).toBe(handler);
      expect(route.options).toBe(options);
    });
  });

  describe("GetRoute", () => {
    it("should create a new GetRoute instance", () => {
      const route = new GetRoute("/path", handler, options);
      expect(route.method).toBe("GET");
      expect(route.path).toBe("/path");
      expect(route.handler).toBe(handler);
      expect(route.options).toBe(options);
    });
  });

  describe("PostRoute", () => {
    it("should create a new PostRoute instance", () => {
      const route = new PostRoute("/path", handler, options);
      expect(route.method).toBe("POST");
      expect(route.path).toBe("/path");
      expect(route.handler).toBe(handler);
      expect(route.options).toBe(options);
    });
  });

  describe("PatchRoute", () => {
    it("should create a new PatchRoute instance", () => {
      const route = new PatchRoute("/path", handler, options);
      expect(route.method).toBe("PATCH");
      expect(route.path).toBe("/path");
      expect(route.handler).toBe(handler);
      expect(route.options).toBe(options);
    });
  });

  describe("PutRoute", () => {
    it("should create a new PutRoute instance", () => {
      const route = new PutRoute("/path", handler, options);
      expect(route.method).toBe("PUT");
      expect(route.path).toBe("/path");
      expect(route.handler).toBe(handler);
      expect(route.options).toBe(options);
    });
  });

  describe("DeleteRoute", () => {
    it("should create a new DeleteRoute instance", () => {
      const route = new DeleteRoute("/path", handler, options);
      expect(route.method).toBe("DELETE");
      expect(route.path).toBe("/path");
      expect(route.handler).toBe(handler);
      expect(route.options).toBe(options);
    });
  });
});
