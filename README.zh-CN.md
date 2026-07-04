# DDYS API Astro Integration

[English](README.md)

`ddys-astro` 是低端影视 API 的官方 Astro 集成，提供自动注入页面、API endpoints、服务端 helper、`.astro` 组件、Content Loader、SEO 路由、诊断接口、安全求片表单、图标资源和可直接复制的示例项目。

## 安装

```bash
npm install ddys-astro
```

添加集成：

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

自动注入页面、API endpoints、sitemap、求片表单和 `Astro.locals.ddys` middleware 都需要 `output: 'server'`。

静态 Astro 项目仍然可以使用组件、Content Loader、样式、内置图标、`robots.txt` 和 `manifest.webmanifest`。静态构建会自动跳过运行时 DDYS 页面和 API 路由，不会强制要求 server adapter。

## 环境变量

```env
DDYS_API_BASE_URL=https://ddys.io/api/v1
DDYS_SITE_BASE_URL=https://ddys.io
DDYS_API_KEY=
DDYS_FORM_SECRET=
DDYS_REQUEST_FORM_ENABLED=false
DDYS_DIAGNOSTICS_ENABLED=false
DDYS_REVALIDATE_TOKEN=
```

`DDYS_API_KEY`、`DDYS_FORM_SECRET`、`DDYS_REVALIDATE_TOKEN` 必须只在服务端使用，不要暴露成公开客户端变量。

## 集成能力

- 使用 Astro Integration API 和 `astro:config:setup`。
- 默认注入 `/ddys` 页面。
- 默认注入 `/api/ddys` API endpoints。
- 通过 middleware 注册 `Astro.locals.ddys`。
- 在 `astro:config:done` 阶段注入 `Astro.locals.ddys` TypeScript 声明。
- 在 `/ddys-astro/images` 暴露从 DDYS public icons 复制的图标。
- 静态 Astro 构建只预渲染静态安全的图标、robots 和 manifest 路由，避免额外要求 adapter。
- 提供 Astro Content Collections 可用的 Content Loader。
- 提供 metadata、sitemap、robots、manifest、Movie JSON-LD 等 SEO 辅助。

## 自动注入页面

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

Proxy 会先做 route allow-list 校验，再映射到 DDYS API。

## 组件

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

可用组件：

- `DdysView`
- `DdysGrid`
- `DdysCard`
- `DdysMovieDetail`
- `DdysSources`
- `DdysSearch`
- `DdysRequestForm`
- `DdysDiagnostics`

## 服务端 Client

```ts
import { createDdysServerClient } from 'ddys-astro/server';

const client = createDdysServerClient();
const latest = await client.latest({ limit: 12 });
```

Client 覆盖 `movies`、`latest`、`hot`、`search`、`suggest`、`calendar`、`movie`、`sources`、`related`、`comments`、`collections`、`collection`、`shares`、`share`、`requests`、`activities`、`user`、`types`、`genres`、`regions`、`me`、`createRequest`、`createComment`、`deleteComment`、`reportInvalidResource`、`follow`、`unfollow`。

在支持 middleware 的路由里可以直接使用 `Astro.locals.ddys`：

```astro
---
const latest = await Astro.locals.ddys.latest({ limit: 12 });
---
```

## 浏览器 Proxy Client

```ts
import { DdysProxyClient } from 'ddys-astro/client';

const ddys = new DdysProxyClient('/api/ddys');
const hot = await ddys.hot({ limit: 12 });
```

Proxy Client 调用自动注入的 Astro API endpoints，DDYS 密钥仍然只保留在服务端。

## Content Loader

```ts
// src/content/config.ts
import { defineCollection, z } from 'astro:content';
import { createDdysContentLoader } from 'ddys-astro/content';

export const collections = {
  ddys: defineCollection({
    loader: createDdysContentLoader({ view: 'latest', limit: 50, params: { type: 'movie' } }),
    schema: z.object({
      title: z.string().optional(),
      slug: z.string().optional()
    }).passthrough()
  })
};
```

## 求片表单

只有配置 API Key 后才建议开启：

```env
DDYS_API_KEY=...
DDYS_FORM_SECRET=...
DDYS_REQUEST_FORM_ENABLED=true
```

求片表单会在调用 DDYS 认证 API 前校验标题、年份、类型、豆瓣 ID、IMDb ID、蜜罐字段、CSRF token 和单身份提交频率。

## 开发检查

```bash
pnpm typecheck
node tools/check.mjs
node --test tests/structure.test.mjs
pnpm build
pnpm pack --dry-run
powershell -ExecutionPolicy Bypass -File tools/build-package.ps1 -Version 0.1.1
```

源码 ZIP 会生成到 `dist/ddys-astro-v0.1.1.zip`。
