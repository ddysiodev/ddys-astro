import { ddysAstroOptions } from 'virtual:ddys-astro/config';
import { endpointConfig } from '../server/config';
import { createDdysRobotsText } from '../server/seo';

export const prerender = false;

export function GET() {
  return new Response(createDdysRobotsText(endpointConfig(ddysAstroOptions)), {
    headers: { 'content-type': 'text/plain; charset=utf-8' }
  });
}
