import { defineCollection, z } from 'astro:content';

const posts = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    category: z.string().default('article'),
    type: z.enum(['article', 'note', 'resource', 'project-review']).default('article'),
    cover: z.string().optional(),
    pinned: z.boolean().default(false),
    draft: z.boolean().default(false),
    series: z.string().optional(),
    lang: z.enum(['zh', 'en']).default('zh'),
  }),
});

const projects = defineCollection({
  type: 'data',
  schema: z.object({
    name: z.string(),
    summary: z.string(),
    techStack: z.array(z.string()).default([]),
    repoUrl: z.string().url().optional(),
    demoUrl: z.string().url().optional(),
    cover: z.string().optional(),
    relatedPosts: z.array(z.string()).default([]),
    order: z.number().default(0),
  }),
});

export const collections = { posts, projects };
