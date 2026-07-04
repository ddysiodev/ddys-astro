import type { APIContext } from 'astro';
import { ddysAstroOptions } from 'virtual:ddys-astro/config';
import { DDYS_ASTRO_VERSION, safeDdysConfig } from '../config';
import { DdysError } from '../client/error';
import { createDdysServerClient } from '../server/client';
import { endpointConfig } from '../server/config';
import { errorJson, json } from '../server/response';

export const prerender = false;

export async function GET() {
  try {
    const config = endpointConfig(ddysAstroOptions);
    if (!config.diagnostics.enabled) throw new DdysError('DDYS diagnostics are disabled.', 403, 'GET', '/diagnostics');
    return json({
      success: true,
      version: DDYS_ASTRO_VERSION,
      framework: 'astro',
      config: safeDdysConfig(config),
      capabilities: {
        integration: true,
        injectedPages: config.astro.pages,
        endpoints: config.astro.endpoints,
        contentLoader: config.astro.contentLoader,
        middleware: config.astro.middleware,
        requestForm: config.requestForm.enabled,
        seoRoutes: config.astro.seoRoutes
      }
    });
  } catch (error) {
    return errorJson(error);
  }
}

export async function POST(context: APIContext) {
  try {
    const config = endpointConfig(ddysAstroOptions);
    if (!config.diagnostics.enabled) throw new DdysError('DDYS diagnostics are disabled.', 403, 'POST', '/diagnostics');
    const client = createDdysServerClient(context, ddysAstroOptions);
    const latest = await client.latest({ limit: 1 }, { noCache: true });
    return json({ success: true, upstream: 'ok', sample: latest });
  } catch (error) {
    return errorJson(error);
  }
}
