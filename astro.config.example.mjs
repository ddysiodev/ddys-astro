import { defineConfig } from 'astro/config';
import ddys from 'ddys-astro';

export default defineConfig({
  output: 'server',
  integrations: [
    ddys({
      mountPath: '/ddys',
      apiPrefix: '/api/ddys',
      pages: true,
      endpoints: true,
      seoRoutes: true
    })
  ]
});
