import { defineCollection, z } from 'astro:content';
import { createDdysContentLoader } from 'ddys-astro/content';

export const collections = {
  ddys: defineCollection({
    loader: createDdysContentLoader({ view: 'latest', limit: 24 }),
    schema: z.object({
      title: z.string().optional(),
      slug: z.string().optional(),
      year: z.union([z.string(), z.number()]).optional()
    }).passthrough()
  })
};
