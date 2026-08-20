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
    /** 系列内章节序号（1 起），控制系列页与文内导航的排序 */
    seriesOrder: z.number().int().optional(),
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

const resources = defineCollection({
  type: 'data',
  schema: z.object({
    title: z.string(),
    url: z.string().url(),
    description: z.string().default(''),
    category: z.string(), // 如：文档 / 工具 / 教程 / 网站 / 社区
    tags: z.array(z.string()).default([]),
    /** 是否在首页展示（默认 true，存档过多时可将旧条目关掉） */
    featured: z.boolean().default(true),
    order: z.number().default(0),
  }),
});

const series = defineCollection({
  type: 'data',
  schema: z.object({
    title: z.string(),
    description: z.string().default(''),
    /** ongoing = 连载中 / completed = 已完结 */
    status: z.enum(['ongoing', 'completed']).default('ongoing'),
    order: z.number().default(0),
  }),
});

export const collections = { posts, projects, resources, series };
