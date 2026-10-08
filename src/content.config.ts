import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const produkter = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/produkter' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      teaser: z.string(),
      maal: z.string().optional(),
      anvendelse: z.string().optional(),
      billede: image().optional(),
      galleri: z.array(image()).default([]),
      order: z.number().default(99),
    }),
});

export const collections = { produkter };
