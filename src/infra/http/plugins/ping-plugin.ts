import { HttpPlugin, HttpApp, HttpRequest, HttpResponse } from '../types';
import { Route } from '../route';

export class PingPlugin implements HttpPlugin {
  readonly name = 'ping';

  async install<Framework>(app: HttpApp<Framework>): Promise<void> {
    
    this.registerPingRoute(app);

    console.log(`Ping plugin installed with path: /ping`);
  }

  uninstall<Framework>(app: HttpApp<Framework>): void {
    const routeRegistry = app.getRouteRegistry();
    const removed = routeRegistry.removeRoute('GET', '/ping');

    if (removed) {
      console.log(`Ping route removed from path: /ping`);
    }

    console.log(`Ping plugin uninstalled`);
  }

  beforeStart<Framework>(app: HttpApp<Framework>): void {
    console.log(`Ping plugin: Application starting...`);
  }

  afterStart<Framework>(app: HttpApp<Framework>): void {
    console.log(`Ping plugin: Application started successfully`);
  }

  beforeStop<Framework>(app: HttpApp<Framework>): void {
    console.log(`Ping plugin: Application stopping...`);
  }

  afterStop<Framework>(app: HttpApp<Framework>): void {
    console.log(`Ping plugin: Application stopped`);
  }

  private registerPingRoute(app: HttpApp): void {
    const pingHandler = async (req: HttpRequest, res: HttpResponse) => {
      try {
          res.setHeader('Content-Type', 'text/plain');
          res.status(200);
          res.text('pong');
      } catch (error) {

        res.setHeader('Content-Type', 'text/plain');
        res.status(503).text('error');
      }
    };

    const pingRoute = new Route(
      'GET',
      '/ping',
      pingHandler,
      {
        cors: { origin: '*' },
        logging: { level: 'info' }
      }
    );

    const routeRegistry = app.getRouteRegistry();
    routeRegistry.register(pingRoute);
  }
}
