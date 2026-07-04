import { DdysError } from '../client/error';

export function json(data: unknown, status = 200, headers: HeadersInit = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...headers
    }
  });
}

export function errorJson(error: unknown) {
  const status = error instanceof DdysError && error.status ? error.status : 500;
  return json({
    success: false,
    message: error instanceof Error ? error.message : 'Unknown DDYS error.'
  }, status >= 400 && status < 600 ? status : 500);
}

export function requirePost(request: Request) {
  if (request.method.toUpperCase() !== 'POST') return json({ success: false, message: 'Method not allowed.' }, 405);
  return null;
}
