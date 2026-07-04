import { ddysAstroOptions } from 'virtual:ddys-astro/config';
import { endpointConfig } from '../server/config';
import { createDdysManifest } from '../server/seo';
import { json } from '../server/response';

export const prerender = false;

export function GET() {
  return json(createDdysManifest(endpointConfig(ddysAstroOptions)), 200, {
    'content-type': 'application/manifest+json; charset=utf-8'
  });
}
