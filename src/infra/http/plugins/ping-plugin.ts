import { HttpPlugin, HttpApp, HttpRequest, HttpResponse } from '../types';
import { Route } from '../route';
import { ConsoleLogger, Logger } from '../../../common';

export class PingPlugin implements HttpPlugin {
  readonly name = 'ping';
  private logger: Logger;

  async install<Framework>(app: HttpApp<Framework>, logger?: Logger): Promise<void> {
    this.logger = logger || new ConsoleLogger();
    this.registerPingRoute(app);

    this.logger.info(`Ping plugin installed with path: /ping`);
  }

  uninstall<Framework>(app: HttpApp<Framework>): void {
    const routeRegistry = app.getRouteRegistry();
    const removed = routeRegistry.removeRoute('GET', '/ping');

    if (removed) {
      this.logger.info(`Ping route removed from path: /ping`);
    }

    this.logger.info(`Ping plugin uninstalled`);
  }

  beforeStart<Framework>(app: HttpApp<Framework>): void {
    this.logger.debug(`Ping plugin: Application starting...`);
  }

  afterStart<Framework>(app: HttpApp<Framework>): void {
    this.logger.debug(`Ping plugin: Application started successfully`);
  }

  beforeStop<Framework>(app: HttpApp<Framework>): void {
    this.logger.debug(`Ping plugin: Application stopping...`);
  }

  afterStop<Framework>(app: HttpApp<Framework>): void {
    this.logger.debug(`Ping plugin: Application stopped`);
  }

  async gracefulShutdown<Framework>(app: HttpApp<Framework>, signals?: string[]): Promise<void> {
    const signalText = signals && signals.length > 0 ? ` (${signals.join(', ')})` : '';
    this.logger.debug(`Ping plugin: Graceful shutdown initiated${signalText}`);
    
    // Ping plugin doesn't need special cleanup
    // Just log the shutdown
    this.logger.debug('Ping plugin: Graceful shutdown completed');
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
