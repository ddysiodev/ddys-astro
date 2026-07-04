# DDYS API Astro Integration

[中文](README.zh-CN.md)

`ddys-astro` is the official Astro integration for the DDYS API. It injects Astro pages, API endpoints, server helpers, `.astro` components, a content loader, SEO routes, diagnostics, secure request-form handling, icons, and ready-to-copy examples.

## Installation

```bash
npm install ddys-astro
```

Add the integration:

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import ddys from 'ddys-astro';

export default defineConfig({
  output: 'server',
  integrations: [
    ddys({
      mountPath: '/ddys',
      apiPrefix: '/api/ddys'
    })
  ]
});
```

`output: 'server'` is recommended when using injected DDYS endpoints and request forms.

## Environment

```env
DDYS_API_BASE_URL=https://ddys.io/api/v1
DDYS_SITE_BASE_URL=https://ddys.io
DDYS_API_KEY=
DDYS_FORM_SECRET=
DDYS_REQUEST_FORM_ENABLED=false
DDYS_DIAGNOSTICS_ENABLED=false
DDYS_REVALIDATE_TOKEN=
```

Keep `DDYS_API_KEY`, `DDYS_FORM_SECRET`, and `DDYS_REVALIDATE_TOKEN` server-only. Do not expose them as public client variables.

## Integration Features

- Uses the Astro Integration API and `astro:config:setup`.
- Injects pages under `/ddys` by default.
- Injects API endpoints under `/api/ddys` by default.
- Registers `Astro.locals.ddys` through middleware.
- Serves icons copied from the DDYS public icon set at `/ddys-astro/images`.
- Ships a content loader for Astro Content Collections.
- Ships SEO helpers for metadata, sitemap, robots, manifest, and Movie JSON-LD.

## Injected Pages

- `/ddys`
- `/ddys/latest`
- `/ddys/hot`
- `/ddys/movies`
- `/ddys/search`
- `/ddys/calendar`
- `/ddys/movie/[slug]`
- `/ddys/movie/[slug]/sources`
- `/ddys/collections`
- `/ddys/shares`
- `/ddys/types`
- `/ddys/genres`
- `/ddys/regions`
- `/ddys/request`
- `/ddys/diagnostics`

## API Endpoints

- `GET /api/ddys/proxy`
- `GET /api/ddys/request`
- `POST /api/ddys/request`
- `GET /api/ddys/diagnostics`
- `POST /api/ddys/diagnostics`
- `POST /api/ddys/revalidate`
- `GET /sitemap.xml`
- `GET /robots.txt`
- `GET /manifest.webmanifest`

The proxy uses an allow-list before mapping routes to the DDYS API.

## Components

```astro
---
import DdysView from 'ddys-astro/components/DdysView';
import DdysSearch from 'ddys-astro/components/DdysSearch';
import DdysRequestForm from 'ddys-astro/components/DdysRequestForm';
import 'ddys-astro/styles.css';
---

<DdysView view="latest" params={{ limit: 12 }} />
<DdysSearch />
<DdysRequestForm />
```

Available components:

- `DdysView`
- `DdysGrid`
- `DdysCard`
- `DdysMovieDetail`
- `DdysSources`
- `DdysSearch`
- `DdysRequestForm`
- `DdysDiagnostics`

## Server Client

```ts
import { createDdysServerClient } from 'ddys-astro/server';

const client = createDdysServerClient();
const latest = await client.latest({ limit: 12 });
```

The client covers `movies`, `latest`, `hot`, `search`, `suggest`, `calendar`, `movie`, `sources`, `related`, `comments`, `collections`, `collection`, `shares`, `share`, `requests`, `activities`, `user`, `types`, `genres`, `regions`, `me`, `createRequest`, `createComment`, `deleteComment`, `reportInvalidResource`, `follow`, and `unfollow`.

## Content Loader

```ts
// src/content/config.ts
import { defineCollection, z } from 'astro:content';
import { createDdysContentLoader } from 'ddys-astro/content';

export const collections = {
  ddys: defineCollection({
    loader: createDdysContentLoader({ view: 'latest', limit: 50 }),
    schema: z.object({
      title: z.string().optional(),
      slug: z.string().optional()
    }).passthrough()
  })
};
```

## Request Form

Enable it only when an API key is configured:

```env
DDYS_API_KEY=...
DDYS_FORM_SECRET=...
DDYS_REQUEST_FORM_ENABLED=true
```

The form validates title, year, type, Douban ID, IMDb ID, honeypot field, CSRF token, and rate limits before calling the authenticated DDYS API.

## Development Checks

```bash
pnpm typecheck
node tools/check.mjs
node --test tests/structure.test.mjs
pnpm build
pnpm pack --dry-run
powershell -ExecutionPolicy Bypass -File tools/build-package.ps1 -Version 0.1.0
```

The source ZIP is generated at `dist/ddys-astro-v0.1.0.zip`.
