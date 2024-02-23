import { Route } from "./route";

type WebFrameworkMethods<T = unknown> = {
  post: (
    path: string | string[],
    handler: (...args: unknown[]) => Promise<T>
  ) => void;
  put: (
    path: string | string[],
    handler: (...args: unknown[]) => Promise<T>
  ) => void;
  patch: (
    path: string | string[],
    handler: (...args: unknown[]) => Promise<T>
  ) => void;
  get: (
    path: string | string[],
    handler: (...args: unknown[]) => Promise<T>
  ) => void;
  delete: (
    path: string | string[],
    handler: (...args: unknown[]) => Promise<T>
  ) => void;
};

export abstract class Router {
  constructor(protected framework: WebFrameworkMethods) {}

  public mount(...routes: Route[]) {
    for (const route of routes) {
      switch (route.method.toUpperCase()) {
        case "POST": {
          if (Array.isArray(route.path)) {
            route.path.forEach((path) => {
              this.framework.post(path, route.createPipeline());
            });
          } else {
            this.framework.post(<string>route.path, route.createPipeline());
          }
          break;
        }
        case "PATCH": {
          if (Array.isArray(route.path)) {
            route.path.forEach((path) => {
              this.framework.patch(path, route.createPipeline());
            });
          } else {
            this.framework.patch(<string>route.path, route.createPipeline());
          }
          break;
        }
        case "GET": {
          if (Array.isArray(route.path)) {
            route.path.forEach((path) => {
              this.framework.get(path, route.createPipeline());
            });
          } else {
            this.framework.get(<string>route.path, route.createPipeline());
          }
          break;
        }
        case "PUT": {
          if (Array.isArray(route.path)) {
            route.path.forEach((path) => {
              this.framework.put(path, route.createPipeline());
            });
          } else {
            this.framework.put(<string>route.path, route.createPipeline());
          }
          break;
        }
        case "DELETE": {
          if (Array.isArray(route.path)) {
            route.path.forEach((path) => {
              this.framework.delete(path, route.createPipeline());
            });
          } else {
            this.framework.delete(<string>route.path, route.createPipeline());
          }
          break;
        }
        default: {
          // TODO: fix it
          throw new Error("Method not defined");
        }
      }
    }
  }

  public abstract configure(...args: unknown[]);
}
