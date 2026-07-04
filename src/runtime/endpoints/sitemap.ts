import type { APIContext } from 'astro';
import { ddysAstroOptions } from 'virtual:ddys-astro/config';
import { createDdysServerClient } from '../server/client';
import { endpointConfig } from '../server/config';
import { createDdysSitemap } from '../server/seo';

export const prerender = false;

export async function GET(context: APIContext) {
  const config = endpointConfig(ddysAstroOptions);
  const xml = await createDdysSitemap(createDdysServerClient(context, ddysAstroOptions), config);
  return new Response(xml, {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': `s-maxage=${config.cache.dictionaryTtl}, stale-while-revalidate=${config.cache.dictionaryTtl}`
    }
  });
}
