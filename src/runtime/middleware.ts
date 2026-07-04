import { defineMiddleware } from 'astro:middleware';
import { createDdysServerClient } from './server/client';

export const onRequest = defineMiddleware(async (context, next) => {
  context.locals.ddys = createDdysServerClient(context);
  return next();
});
