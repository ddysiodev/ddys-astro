import type { APIContext } from 'astro';
import { ddysAstroOptions } from 'virtual:ddys-astro/config';
import { DdysError } from '../client/error';
import { revalidateDdysCache } from '../server/cache';
import { endpointConfig } from '../server/config';
import { errorJson, json } from '../server/response';

export const prerender = false;

export async function POST(context: APIContext) {
  try {
    const config = endpointConfig(ddysAstroOptions);
    const body = await context.request.json().catch(() => ({})) as Record<string, unknown>;
    const token = String(body.token || context.request.headers.get('x-ddys-revalidate-token') || '');
    if (!config.revalidateToken || token !== config.revalidateToken) {
      throw new DdysError('Invalid DDYS revalidate token.', 403, 'POST', '/revalidate');
    }
    return json(revalidateDdysCache({
      route: typeof body.route === 'string' ? body.route : undefined,
      tag: typeof body.tag === 'string' ? body.tag : undefined,
      path: typeof body.path === 'string' ? body.path : undefined
    }));
  } catch (error) {
    return errorJson(error);
  }
}
