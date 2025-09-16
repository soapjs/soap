import { HttpContext, HttpRequest, HttpResponse } from '../types';
import { MetricsCollector, MetricsConfig } from './types';

export class MetricsMiddleware<Req extends HttpRequest = HttpRequest, Res extends HttpResponse = HttpResponse> {
  constructor(private readonly collector: MetricsCollector) {}

  middleware() {
    return (req: Req, res: Res, next: () => void) => {
      this.collector.withRequestContext(req, res, next);
    };
  }

  process(context: HttpContext): void {
    const { req, res, next } = context;
    this.collector.withRequestContext(req, res, next);
  }

  getCollector(): MetricsCollector {
    return this.collector;
  }

  destroy(): void {
    this.collector.destroy();
  }
}

export function createMetricsMiddleware<Req extends HttpRequest = HttpRequest, Res extends HttpResponse = HttpResponse>(
  collector: MetricsCollector
): MetricsMiddleware<Req, Res> {
  return new MetricsMiddleware<Req, Res>(collector);
}

export const defaultMetricsConfig: MetricsConfig = {
  enabled: true,
  metrics: {
    responseTime: true,
    requestCount: true,
    errorRate: true,
    memoryUsage: true,
    cpuUsage: true
  },
  collectInterval: 30000, // 30 seconds
  includeRouteParams: false,
  customLabels: {}
};
