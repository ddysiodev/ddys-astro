import type { AstroIntegration } from 'astro';
import { promises as fs } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { DEFAULT_DDYS_CONFIG, type DdysConfigInput } from './runtime/config';
import { normalizeRoutePrefix } from './runtime/utils/security';

export interface DdysAstroOptions extends DdysConfigInput {
  mountPath?: string;
  apiPrefix?: string;
  pages?: boolean;
  endpoints?: boolean;
  seoRoutes?: boolean;
  styles?: boolean;
  middleware?: boolean;
  contentLoader?: boolean;
}

export function ddysAstro(options: DdysAstroOptions = {}): AstroIntegration {
  const runtimeOptions = normalizeIntegrationOptions(options);
  return {
    name: 'ddys-astro',
    hooks: {
      'astro:config:setup': async ({ addMiddleware, createCodegenDir, injectRoute, injectScript, updateConfig, logger }) => {
        const codegenDir = createCodegenDir();
        const configFile = new URL('ddys-astro-config.mjs', codegenDir);
        await fs.mkdir(fileURLToPath(codegenDir), { recursive: true });
        await fs.writeFile(configFile, `export const ddysAstroOptions = ${JSON.stringify(runtimeOptions, null, 2)};\n`, 'utf8');

        updateConfig({
          vite: {
            resolve: {
              alias: {
                'virtual:ddys-astro/config': fileURLToPath(configFile)
              }
            }
          }
        });

        const route = (pattern: string, file: string) => injectRoute({
          pattern,
          entrypoint: entrypoint(file),
          prerender: false
        });

        route(`${runtimeOptions.iconBasePath}/[...path]`, 'runtime/endpoints/assets.mjs');

        if (runtimeOptions.astro?.endpoints !== false) {
          route(`${runtimeOptions.routePrefix}/proxy`, 'runtime/endpoints/proxy.mjs');
          route(`${runtimeOptions.routePrefix}/request`, 'runtime/endpoints/request.mjs');
          route(`${runtimeOptions.routePrefix}/diagnostics`, 'runtime/endpoints/diagnostics.mjs');
          route(`${runtimeOptions.routePrefix}/revalidate`, 'runtime/endpoints/revalidate.mjs');
        }

        if (runtimeOptions.astro?.seoRoutes !== false) {
          route('/sitemap.xml', 'runtime/endpoints/sitemap.mjs');
          route('/robots.txt', 'runtime/endpoints/robots.mjs');
          route('/manifest.webmanifest', 'runtime/endpoints/manifest.mjs');
        }

        if (runtimeOptions.astro?.pages !== false) {
          route(runtimeOptions.astro?.mountPath || '/ddys', 'runtime/pages/index.astro');
          route(`${runtimeOptions.astro?.mountPath}/latest`, 'runtime/pages/latest.astro');
          route(`${runtimeOptions.astro?.mountPath}/hot`, 'runtime/pages/hot.astro');
          route(`${runtimeOptions.astro?.mountPath}/movies`, 'runtime/pages/movies.astro');
          route(`${runtimeOptions.astro?.mountPath}/search`, 'runtime/pages/search.astro');
          route(`${runtimeOptions.astro?.mountPath}/calendar`, 'runtime/pages/calendar.astro');
          route(`${runtimeOptions.astro?.mountPath}/collections`, 'runtime/pages/collections.astro');
          route(`${runtimeOptions.astro?.mountPath}/shares`, 'runtime/pages/shares.astro');
          route(`${runtimeOptions.astro?.mountPath}/types`, 'runtime/pages/types.astro');
          route(`${runtimeOptions.astro?.mountPath}/genres`, 'runtime/pages/genres.astro');
          route(`${runtimeOptions.astro?.mountPath}/regions`, 'runtime/pages/regions.astro');
          route(`${runtimeOptions.astro?.mountPath}/request`, 'runtime/pages/request.astro');
          route(`${runtimeOptions.astro?.mountPath}/diagnostics`, 'runtime/pages/diagnostics.astro');
          route(`${runtimeOptions.astro?.mountPath}/movie/[slug]`, 'runtime/pages/movie/[slug]/index.astro');
          route(`${runtimeOptions.astro?.mountPath}/movie/[slug]/sources`, 'runtime/pages/movie/[slug]/sources.astro');
        }

        if (runtimeOptions.astro?.styles !== false) {
          injectScript('page', "import 'ddys-astro/styles.css';");
        }

        if (runtimeOptions.astro?.middleware !== false) {
          addMiddleware({
            order: 'pre',
            entrypoint: entrypoint('runtime/middleware.mjs')
          });
        }

        logger.info(`DDYS Astro integration mounted at ${runtimeOptions.astro?.mountPath} with API ${runtimeOptions.routePrefix}.`);
      }
    }
  };
}

export default ddysAstro;

function normalizeIntegrationOptions(options: DdysAstroOptions): DdysConfigInput {
  const apiPrefix = normalizeRoutePrefix(options.apiPrefix ?? options.routePrefix ?? DEFAULT_DDYS_CONFIG.routePrefix);
  const mountPath = normalizeRoutePrefix(options.mountPath ?? options.astro?.mountPath ?? DEFAULT_DDYS_CONFIG.astro.mountPath);
  return {
    ...options,
    routePrefix: apiPrefix,
    iconBasePath: normalizeRoutePrefix(options.iconBasePath ?? DEFAULT_DDYS_CONFIG.iconBasePath),
    astro: {
      ...options.astro,
      apiPrefix,
      mountPath,
      pages: options.pages ?? options.astro?.pages ?? true,
      endpoints: options.endpoints ?? options.astro?.endpoints ?? true,
      seoRoutes: options.seoRoutes ?? options.astro?.seoRoutes ?? true,
      styles: options.styles ?? options.astro?.styles ?? true,
      middleware: options.middleware ?? options.astro?.middleware ?? true,
      contentLoader: options.contentLoader ?? options.astro?.contentLoader ?? true
    }
  };
}

function entrypoint(file: string) {
  return fileURLToPath(new URL(file, import.meta.url));
}
