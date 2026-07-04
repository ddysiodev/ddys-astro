import type { APIContext } from 'astro';
import { promises as fs } from 'node:fs';

export const prerender = true;

const allowed = new Set(['icon-16.png', 'icon-32.png', 'icon-192.png', 'icon-512.png', 'logo.png']);

export function getStaticPaths() {
  return Array.from(allowed, (path) => ({ params: { path } }));
}

export async function GET(context: APIContext) {
  const name = String(context.params.path || '').split('/').pop() || '';
  if (!allowed.has(name)) return new Response('Not found', { status: 404 });
  const file = new URL(`../../../public/images/${name}`, import.meta.url);
  const buffer = await fs.readFile(file).catch(() => null);
  if (!buffer) return new Response('Not found', { status: 404 });
  return new Response(buffer, {
    headers: {
      'content-type': 'image/png',
      'cache-control': 'public, max-age=31536000, immutable'
    }
  });
}
