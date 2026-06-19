# HTTP adapters (contracts, OpenAPI, tracing)

SoapJS keeps **framework ports** in `@soapjs/soap` and **optional adapters** in separate packages.
`@soapjs/soap-express` is Express-only — it does not bundle Zod, OpenAPI, or OpenTelemetry.

Your application (composition root) chooses which adapters to install and how to wire them.

## Mental model

```
┌─────────────────────────────────────────────────────────────┐
│  Your app (e.g. soap-node-demo src/index.ts)                │
│  • npm deps: soap-express + optional adapter packages       │
│  • bootstrap({ plugins, middleware: { pre } })              │
└───────────────────────────┬─────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
 @soapjs/soap-express   adapter packages    @soapjs/soap
 (routing, CQRS,        (Zod, OpenAPI,      (HttpContract,
  bootstrap hooks)       OTel, …)            ApiDocFragment,
                                            Tracer, MetricsPlugin)
```

| Layer | Responsibility |
|-------|----------------|
| `@soapjs/soap/http` | Ports and shared types — no Express, no Zod |
| `@soapjs/soap-express` | Controllers, route builder, `bootstrap`, `plugins[]`, `middleware.pre` |
| Adapter packages | Implement ports; attach validation / docs / tracing |
| Your `index.ts` | Install packages and pass plugins + middleware |

## Ports in `@soapjs/soap/http`

Import from `@soapjs/soap/http` (or re-exports on framework entry points that document the port only).

### `HttpContract` and `RouteContractMeta`

```typescript
import type { HttpContract, RouteContractMeta } from '@soapjs/soap/http';

// Opaque contract — adapter supplies validation + schema emission
const contract: HttpContract = {
  kind: 'zod',           // or 'typebox', 'joi', …
  schema: mySchema,
  target: 'body',        // 'query' | 'params'
};
```

Helpers: `isHttpContract()`, `normalizeContracts()`.

### `ApiDocFragment`

Route-level OpenAPI metadata stored on `RouteAdditionalOptions.apiDoc` and read by documentation plugins.

```typescript
import type { ApiDocFragment } from '@soapjs/soap/http';

const apiDoc: ApiDocFragment = {
  tags: ['users'],
  summary: 'Create user',
  requestBody: { /* … */ },
  responses: { '201': { description: 'Created' } },
};
```

Adapters such as `@soapjs/soap-openapi` may use richer types internally; they remain compatible with `ApiDocFragment`.

### `Tracer` and `Span`

```typescript
import { Tracer } from '@soapjs/soap/http';

// Bind in DI (optional)
container.bindValue(Tracer.Token, myTracer);
```

Implementations live in adapter packages (e.g. noop or OpenTelemetry).

## Adapter packages

| Package | Purpose |
|---------|---------|
| `@soapjs/soap-contract-zod` | `bodyContract`, … — peers: `@soapjs/soap` + `zod` + `express` only |
| `@soapjs/soap-openapi` | `DocumentationPlugin`, collectors, `/openapi.json`, Swagger UI (reads `DecoratorRegistry` from `@soapjs/soap/http`) |
| `@soapjs/soap-node-otel` | `TracingMiddleware`, `NoopTracer` implementing `Tracer` |

Peer dependency on `@soapjs/soap` (≥ 0.12.1 — `DecoratorRegistry` and typed `apiDoc` / `contract` on routes).

## Wiring in the application

### Minimal HTTP (no adapters)

```bash
npm install @soapjs/soap @soapjs/soap-express express
```

```typescript
import { bootstrap } from '@soapjs/soap-express';

await bootstrap({
  controllers: [MyController],
  middleware: { cors: true, logging: true },
  healthCheck: true,
});
```

### Zod validation + route documentation metadata

```bash
npm install @soapjs/soap-contract-zod zod @soapjs/soap express
```

`bodyContract()` returns `RouteAdditionalOptions` with:

- `apiDoc` — fragment for OpenAPI collectors
- `middlewares.pre` — Express validation middleware (no magic inside soap-express)

```typescript
import { z } from 'zod';
import { Post, Controller } from '@soapjs/soap-express';
import { bodyContract } from '@soapjs/soap-contract-zod';

const CreateBody = z.object({ name: z.string() });

@Controller('/items')
class ItemsController {
  @Post('/', bodyContract(CreateBody, { tags: ['items'], summary: 'Create' }))
  async create() { /* … */ }
}
```

`soap-express` merges `options.middlewares.pre` in the route builder. It does **not** `require('@soapjs/soap-contract-zod')`.

### OpenAPI + Swagger UI

```bash
npm install @soapjs/soap-openapi
```

Register as an `HttpPlugin` (not a `bootstrap({ docs: true })` flag on express):

```typescript
import { DocumentationPlugin } from '@soapjs/soap-openapi';
import { bootstrap } from '@soapjs/soap-express';

await bootstrap({
  controllers: [MyController],
  plugins: [
    {
      plugin: new DocumentationPlugin(),
      options: {
        info: { title: 'My API', version: '1.0.0' },
        servers: [{ url: 'http://localhost:3000' }],
        openApiPath: '/openapi.json',
        interactivePath: '/docs',
      },
    },
  ],
});
```

The plugin mounts routes in `afterStart` so the route registry already contains controller metadata (including `apiDoc` from Zod contracts).

### Request tracing

```bash
npm install @soapjs/soap-node-otel
```

Run tracing **before** logging middleware so `req.traceId` is available in access logs:

```typescript
import { TracingMiddleware, NoopTracer, Tracer } from '@soapjs/soap-node-otel';
import { bootstrap } from '@soapjs/soap-express';

const tracer = new NoopTracer();
container.bindValue(Tracer.Token, tracer);

await bootstrap({
  controllers: [MyController],
  middleware: {
    logging: true,
    pre: [TracingMiddleware.create({ tracer })],
  },
});
```

Swap `NoopTracer` for an OpenTelemetry-backed `Tracer` when you add that adapter.

### Prometheus metrics

`MetricsPlugin` ships in **`@soapjs/soap/http`** (core), not in soap-express:

```typescript
import { MetricsPlugin } from '@soapjs/soap/http';

await bootstrap({
  plugins: [
    {
      plugin: new MetricsPlugin({ exposeEndpoint: true, metricsFormat: 'prometheus' }, logger),
      options: { exposeEndpoint: true, metricsFormat: 'prometheus' },
    },
  ],
});
```

## What soap-express does *not* do

- No `bootstrap({ docs, tracing, metrics })` shortcuts that `require()` adapter packages
- No bundled Zod or OpenAPI generators
- No automatic install of `@soapjs/soap-contract-zod` when a route uses `bodyContract` — you must add the dependency yourself

Legacy **Joi**-style `validation.request.schema.validate()` on a route is still handled inside soap-express for backward compatibility.

## Reference: soap-node-demo

The [soap-node-demo](https://github.com/soapjs/soap-node-demo) repository shows the full stack:

- `src/index.ts` — `DocumentationPlugin`, `MetricsPlugin`, `TracingMiddleware` in `plugins` / `middleware.pre`
- `src/features/characters/api/characters.controller.ts` — `bodyContract` from `@soapjs/soap-contract-zod`
- `vendor/*.tgz` — pinned packages until npm publish

See also the demo README section **Optional adapters**.

## Adding a new adapter

1. Define or reuse a port in `@soapjs/soap/http` (`HttpContract`, `ApiDocFragment`, `Tracer`, …).
2. Publish a package that depends on `@soapjs/soap` (+ framework peer if needed).
3. Document how the app wires it (`plugins`, `middleware.pre`, or route `middlewares.pre`).
4. Do **not** add `require('your-adapter')` inside `@soapjs/soap-express`.

Example: a TypeBox package would export `bodyContractTypeBox()` setting `kind: 'typebox'`, `middlewares.pre`, and `apiDoc` the same way as the Zod adapter.

## Version matrix (demo pin)

| Package | Role |
|---------|------|
| `@soapjs/soap` ≥ 0.12.1 | `DecoratorRegistry`, `HttpContract`, `ApiDocFragment`, `Tracer` ports |
| `@soapjs/soap-express` ≥ 0.5.0 | Express bootstrap without adapter shortcuts |
| `@soapjs/soap-contract-zod` 0.1.1 | Zod contracts (peers: soap + zod + express) |
| `@soapjs/soap-openapi` 0.1.1 | OpenAPI plugin (peer: `@soapjs/soap` only) |
| `@soapjs/soap-node-otel` 0.1.0 | Tracing middleware + noop tracer |
