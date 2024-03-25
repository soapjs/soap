import { Route } from "./route";
import { Router, WebFrameworkMethods } from "./router";

export abstract class CommonRouter implements Router {
  constructor(protected framework: WebFrameworkMethods) {}

  protected createPipeline() {
    return async function (request, response) {
      const { hooks, validator, authorization, io, handler } = this;

      if (authorization) {
        const auth = authorization(request);

        if (auth === false) {
          return response.status(401).send("Unauthorized");
        }
      }

      if (validator) {
        const { valid, message, code, errors } = validator(request);

        if (!valid) {
          return response.status(code || 400).send({
            message,
            errors,
          });
        }
      }

      try {
        let args;
        let input;

        if (hooks?.pre) {
          args = hooks.pre(request);
        }

        if (io?.fromRequest) {
          input = io.fromRequest(request, args);
        }

        const output = await handler(input);

        if (hooks?.post) {
          hooks.post(output);
        }

        if (io?.toResponse) {
          const r = io.toResponse(output);
          response.status(r.status).send(r.body);
        } else {
          response.status(200).send("OK");
        }
      } catch (error) {
        console.log(error);
        response.status(500).send("Internal Server Error");
      }
    };
  }

  protected mountRoute(route: Route) {
    switch (route.method.toUpperCase()) {
      case "POST": {
        if (Array.isArray(route.path)) {
          route.path.forEach((path) => {
            this.framework.post(path, this.createPipeline());
          });
        } else {
          this.framework.post(<string>route.path, this.createPipeline());
        }
        break;
      }
      case "PATCH": {
        if (Array.isArray(route.path)) {
          route.path.forEach((path) => {
            this.framework.patch(path, this.createPipeline());
          });
        } else {
          this.framework.patch(<string>route.path, this.createPipeline());
        }
        break;
      }
      case "GET": {
        if (Array.isArray(route.path)) {
          route.path.forEach((path) => {
            this.framework.get(path, this.createPipeline());
          });
        } else {
          this.framework.get(<string>route.path, this.createPipeline());
        }
        break;
      }
      case "PUT": {
        if (Array.isArray(route.path)) {
          route.path.forEach((path) => {
            this.framework.put(path, this.createPipeline());
          });
        } else {
          this.framework.put(<string>route.path, this.createPipeline());
        }
        break;
      }
      case "DELETE": {
        if (Array.isArray(route.path)) {
          route.path.forEach((path) => {
            this.framework.delete(path, this.createPipeline());
          });
        } else {
          this.framework.delete(<string>route.path, this.createPipeline());
        }
        break;
      }
      default: {
        // TODO: fix it
        throw new Error("Method not defined");
      }
    }
  }

  public mount(data: Route | Route[]) {
    if (Array.isArray(data)) {
      data.forEach((route) => this.mountRoute(route));
    } else {
      this.mountRoute(data);
    }
  }

  public abstract configure(...args: unknown[]);
}
