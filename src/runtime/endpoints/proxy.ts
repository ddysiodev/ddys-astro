import type { APIContext } from 'astro';
import { ddysAstroOptions } from 'virtual:ddys-astro/config';
import { cleanRuntimeQuery } from '../config';
import { DdysError } from '../client/error';
import { cachedDdys } from '../server/cache';
import { createDdysServerClient } from '../server/client';
import { endpointConfig } from '../server/config';
import { errorJson, json } from '../server/response';

export const prerender = false;

export async function GET(context: APIContext) {
  try {
    const config = endpointConfig(ddysAstroOptions);
    if (!config.proxy.enabled) throw new DdysError('DDYS proxy is disabled.', 403, 'GET', '/proxy');
    const route = context.url.searchParams.get('route') || 'latest';
    if (!config.proxy.allowRoutes.includes(route)) throw new DdysError('Route is not allowed.', 403, 'GET', '/proxy');
    const client = createDdysServerClient(context, ddysAstroOptions);
    const query = {
      ...cleanRuntimeQuery(context.url.searchParams),
      slug: context.url.searchParams.get('slug') || undefined,
      id: context.url.searchParams.get('id') || undefined,
      username: context.url.searchParams.get('username') || undefined
    };
    const payload = await cachedDdys(client, route, query, context.url.searchParams.get('noCache') === '1');
    return json(payload, 200, {
      'cache-control': `s-maxage=${config.cache.defaultTtl}, stale-while-revalidate=${config.cache.defaultTtl}`,
      'x-ddys-astro': 'proxy',
      'x-ddys-cache': String(payload.meta?.cache || 'unknown')
    });
  } catch (error) {
    return errorJson(error);
  }
}
