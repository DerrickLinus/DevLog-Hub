# 个人技术博客 — 部署方案（Astro + Vercel）

> 状态：**待确认**。本文档仅为方案规划，尚未实施。
> 确认后按「分阶段实施步骤」逐步落地。

---

## 1. 方案概览

| 项 | 选择 |
|---|---|
| 框架 | Astro（静态站点，默认零 JS 输出） |
| 语言 | TypeScript |
| 样式 | Tailwind CSS |
| 内容 | Markdown/MDX + Content Collections（类型安全） |
| 代码高亮 | Shiki（Astro 内置） |
| 数学公式 | KaTeX（remark-math + rehype-katex） |
| 搜索 | Pagefind（纯静态、构建后生成索引） |
| 评论 | Giscus（基于 GitHub Discussions，免费） |
| 统计 | Umami（隐私友好，自托管或 Umami Cloud） |
| 订阅 | RSS（`@astrojs/rss`） |
| SEO | `@astrojs/sitemap` + OG 卡片 + 语义化 HTML |
| 部署 | Vercel（Hobby 免费层，自动 CI/CD + PR 预览） |
| 版本管理 | Git + GitHub |

**渲染策略**：纯静态（`output: 'static'`）。所有页面构建期生成，无服务端运行时，零数据库。

---

## 2. 依赖清单

| 包 | 用途 |
|---|---|
| `astro` | 核心框架 |
| `@astrojs/rss` | RSS/Atom 订阅源 |
| `@astrojs/sitemap` | 站点地图 |
| `@astrojs/tailwind` | Tailwind 集成 |
| `@astrojs/mdx` | MDX 支持（可选，需在组件中混入交互时用） |
| `tailwindcss` | 样式 |
| `remark-math` + `rehype-katex` | 数学公式渲染 |
| `pagefind` | 静态搜索索引（构建后 `pagefind --site dist`） |
| `sharp` | 图片优化（Astro 内置依赖） |

> 评论（Giscus）与统计（Umami）通过 `<script>` 客户端嵌入，**无需 npm 依赖**，也不必引入 React。

---

## 3. 项目目录结构（规划）

```
personal-website/
├── astro.config.mjs          # Astro 配置（集成、markdown、站点地址）
├── tailwind.config.mjs       # Tailwind 配置
├── tsconfig.json
├── package.json
├── vercel.json               # Vercel 部署配置（headers/redirects，可选）
├── .env.example              # 环境变量示例（不含真实密钥）
├── .gitignore
├── public/                   # 静态资源（favicon、og 图、robots.txt）
│   └── favicon.svg
└── src/
    ├── content/
    │   ├── config.ts         # Content Collections schema（类型定义）
    │   ├── posts/            # 文章 / 笔记 / 资源存档（Markdown）
    │   │   └── example-post.md
    │   └── projects/         # 项目展示（数据集合）
    │       └── example-project.json
    ├── pages/
    │   ├── index.astro       # 首页（最新文章 + 简介）
    │   ├── blog/
    │   │   ├── index.astro        # 文章列表（分页）
    │   │   ├── [...slug].astro    # 文章详情
    │   │   ├── tags/index.astro   # 标签云
    │   │   ├── tag/[tag].astro    # 按标签过滤
    │   │   └── archive/index.astro# 时间归档
    │   ├── projects/
    │   │   ├── index.astro        # 项目列表
    │   │   └── [slug].astro       # 项目详情
    │   ├── about.astro       # 关于页（完整个人简介）
    │   ├── rss.xml.js        # RSS 输出
    │   └── 404.astro
    ├── layouts/
    │   ├── BaseLayout.astro  # 全局布局（导航/页脚/SEO）
    │   └── PostLayout.astro  # 文章布局（目录/评论/上一篇下一篇）
    ├── components/
    │   ├── Header.astro
    │   ├── Footer.astro
    │   ├── Hero.astro          # 首页个人简介区
    │   ├── PostCard.astro
    │   ├── Comments.astro    # Giscus 嵌入
    │   ├── Analytics.astro   # Umami 嵌入
    │   ├── Search.astro      # Pagefind 搜索框
    │   └── TableOfContents.astro
    ├── data/
    │   └── profile.ts          # 个人简介数据（姓名/头像/简介/社交链接/技能）
    └── styles/
        └── global.css        # 全局样式 + Tailwind 入口
```

---

## 4. 内容模型（Content Collections Schema）

```ts
// src/content/config.ts（示意）
const posts = defineCollection({
  type: 'content',           // Markdown
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
    draft: z.boolean().default(false),   // draft 不参与构建
    series: z.string().optional(),
    lang: z.enum(['zh', 'en']).default('zh'),
  }),
});

const projects = defineCollection({
  type: 'data',              // JSON/YAML
  schema: z.object({
    name: z.string(),
    summary: z.string(),
    techStack: z.array(z.string()),
    repoUrl: z.string().url().optional(),
    demoUrl: z.string().url().optional(),
    cover: z.string().optional(),
    relatedPosts: z.array(z.string()).default([]),
    order: z.number().default(0),
  }),
});
```

---

## 5. 功能模块实现方案

### 5.1 搜索（Pagefind）
- 构建后执行 `pagefind --site dist` 生成索引（`package.json` 的 `postbuild` 脚本）。
- 前端 `Search.astro` 调用 `pagefind` 的浏览器 API，纯静态零后端。
- 注意：Pagefind 对中文默认分词可用，若效果不佳可后续调 `pagefind` 的字典配置。

### 5.2 评论（Giscus）
- 前提：GitHub 仓库开启 **Discussions**，并安装 [giscus app](https://github.com/apps/giscus)。
- 通过脚本标签嵌入（无需 React）：

```html
<script src="https://giscus.app/client.js"
  data-repo="YOUR_REPO"
  data-repo-id="R_xxx"
  data-category="Announcements"
  data-category-id="DIC_xxx"
  data-mapping="pathname"
  data-reactions-enabled="1"
  data-theme="preferred_color_scheme"
  crossorigin="anonymous" async>
</script>
```

- 仓库标识通过环境变量注入，避免硬编码。

### 5.3 统计（Umami）
- 两条路线（二选一，推荐前者）：
  1. **Umami Cloud**（免费层）— 零运维，注册即得 `website-id`。
  2. **自托管** — Umami 本身可部署到 Vercel + Postgres（Supabase/Neon），与站点同平台，但多一套要维护的服务。
- 嵌入脚本：

```html
<script defer src="https://analytics.umami.is/script.js"
  data-website-id="YOUR_ID"></script>
```

### 5.4 RSS
- `src/pages/rss.xml.js` 用 `@astrojs/rss` 输出，订阅地址 `/rss.xml`。

### 5.5 SEO / OG
- `BaseLayout` 统一输出 `<title>`、`<meta description>`、`canonical`、`og:*`、`twitter:*`。
- 提供默认 OG 图；文章可用 `cover` 字段覆盖。
- `@astrojs/sitemap` 自动生成 `sitemap.xml`。
- `public/robots.txt` 指向 sitemap。

### 5.6 图片
- 文章图片放 `src/assets/`，用 Astro 内置 `<Image />` / `astro:assets` 自动压缩、响应式、懒加载。

### 5.7 代码高亮 & 公式
- 代码块：Shiki 默认启用，可配主题（深/浅色两套随暗色模式切换）。
- 公式：`astro.config.mjs` 中配置 `remark-math` + `rehype-katex`，引入 KaTeX CSS。

### 5.8 个人简介
- 数据源：`src/data/profile.ts` 集中维护（姓名、头像、一句话简介、详细自我介绍、社交链接、技能标签）。
- 两处呈现：
  1. **首页 Hero**：头像 + 一句话简介 + 社交链接（`Hero.astro`），首屏展示。
  2. **关于页 `/about`**：完整自我介绍、技能、联系方式，可放照片。
- 侧边作者卡暂不做，后续有需要再补。
- 头像放 `public/` 或 `src/assets/`，由 Astro 图片优化处理。

---

## 6. 部署配置

### 6.1 Vercel 项目配置
| 项 | 值 |
|---|---|
| Framework Preset | Astro（自动识别） |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |
| Node.js Version | 22.x |
| 计划 | Hobby（免费） |

### 6.2 环境变量（Vercel 后台配置，`.env.example` 同步）

| 变量 | 用途 | 备注 |
|---|---|---|
| `PUBLIC_SITE_URL` | 站点绝对地址（canonical/OG/RSS 用） | 上线后为 `https://yourdomain.com` |
| `PUBLIC_GISCUS_REPO` | Giscus 仓库 `owner/repo` | |
| `PUBLIC_GISCUS_REPO_ID` | Giscus 仓库 ID | 来自 giscus.app |
| `PUBLIC_GISCUS_CATEGORY` | Discussions 分类名 | |
| `PUBLIC_GISCUS_CATEGORY_ID` | 分类 ID | |
| `PUBLIC_UMAMI_WEBSITE_ID` | Umami 站点 ID | |
| `PUBLIC_UMAMI_SRC` | Umami 脚本地址 | 自托管时填自己的域名 |

> `PUBLIC_` 前缀变量在 Astro 中会暴露到客户端，供评论/统计脚本读取。构建期即可注入，无需运行时。

### 6.3 `vercel.json`（可选，安全头 + 缓存）
```json
{
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    },
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ]
}
```

---

## 7. 上线前第三方准备清单

- [ ] 创建 GitHub 仓库（若尚无）
- [ ] 开启仓库 Discussions，安装 giscus app，获取 repo-id / category-id
- [ ] 注册 Umami（Cloud 或自托管），拿到 website-id
- [ ] （可选）准备域名，指向 Vercel

---

## 8. 分阶段实施步骤（确认后执行）

### 阶段 0 — 前置准备
1. `git init`，创建 GitHub 仓库并关联远程。
2. 准备 Giscus / Umami 账号与 ID。

### 阶段 1 — 项目初始化
1. `npm create astro@latest`（选 TypeScript + 空模板）。
2. 安装依赖：rss / sitemap / tailwind / mdx / remark-math / rehype-katex / pagefind / sharp。
3. 配置 `astro.config.mjs`、`tailwind.config.mjs`、`.gitignore`、`.env.example`。

### 阶段 2 — 内容与布局
1. 定义 Content Collections schema（`config.ts`）。
2. 建立 `BaseLayout`、`PostLayout`、导航、全局样式、暗色模式。
3. 实现首页（含 Hero 个人简介）、文章列表/详情、标签、归档、项目页、关于页。

> ⭐ **自己的 Markdown 预览时点**：阶段 2 完成后即可。此时 schema + 列表页 + 详情页已就绪，把你的 `.md` 文件放入 `src/content/posts/`，运行 `npm run dev` 即可在浏览器看到真实渲染效果。阶段 2 会先用一篇示例文章跑通全流程，你随后即可替换成自己的文档验证排版。

### 阶段 3 — 功能集成
1. RSS、sitemap、robots.txt、OG 卡片。
2. Pagefind 搜索（`postbuild` 脚本 + `Search.astro`）。
3. Giscus 评论、Umami 统计（`Comments.astro` / `Analytics.astro`）。
4. 代码高亮主题、KaTeX 公式、图片优化。

### 阶段 4 — 部署上线
1. 推送到 GitHub，Vercel 导入项目，配置 Framework/环境变量。
2. `vercel.json` 安全头/缓存。
3. 绑定域名，验证 HTTPS、RSS、搜索、评论、统计、OG 预览。

### 阶段 5 — 迭代（后续）
- 系列文章、相关推荐、双语标记、内容备份脚本。

---

## 9. 成本与运维

| 项 | 成本 |
|---|---|
| 托管（Vercel） | 免费（Hobby 层） |
| 评论（Giscus） | 免费（GitHub） |
| 统计（Umami Cloud） | 免费层 / 自托管按需 |
| 域名 | 可选，约 ¥50–100/年 |
| **运维负担** | Push 即部署，零日常运维 |

---

## 10. 风险与注意事项

1. **Pagefind 中文分词**：默认可能对中文词组切分不够精细，上线后实测，必要时调整索引配置或换 FlexSearch/Algolia。
2. **Giscus 依赖 GitHub**：评论存储于 GitHub Discussions，读者评论需 GitHub 账号（技术读者普遍有）。
3. **Umami 自托管**：若选自托管，等于引入额外一套需维护的服务，与"零运维"目标相抵，默认建议 Umami Cloud。
4. **暗色模式下的代码高亮**：需配置 Shiki 双主题，跟随 `prefers-color-scheme` 切换。
5. **draft 文章**：通过 `draft` 字段 + 构建过滤实现"本地可见、线上不发布"，或用 Git 分支管理未完成内容。
