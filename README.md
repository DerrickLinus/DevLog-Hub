# DevLog Hub

我的个人技术博客：记录技术文章、学习笔记、资源收藏与项目积累。

**🌐 线上地址**：[dev-log-hub.vercel.app](https://dev-log-hub.vercel.app)

## 网站内容

- **博客** — 技术文章与学习笔记，支持标签、分类、归档、全文搜索
- **学习教程** — 系列化教程笔记（如 PyTorch 跟学），带时间轴目录与文内导航
- **资源汇总** — 学习资料、工具与网站收藏
- **项目** — 个人项目展示（技术栈、源码、Demo）
- **关于** — 个人介绍与联系方式

## 功能特性

- 📝 Markdown 写作，Content Collections 类型安全管理内容
- 🌗 亮色 / 暗色主题（跟随系统 + 手动切换）
- 🔍 Pagefind 静态全文搜索（支持中文）
- 💬 Giscus 评论（基于 GitHub Discussions）
- 📡 RSS 订阅（`/rss.xml`）
- 📊 Umami 隐私友好统计
- 📖 文章目录（TOC）、预计阅读时间、数学公式（KaTeX）、代码高亮（Shiki 双主题）
- ⚡ 纯静态输出，默认零 JS，Lighthouse 表现友好
- 📱 响应式设计，移动端目录抽屉

## 技术栈

| 类别 | 技术 |
|---|---|
| 框架 | [Astro 5](https://astro.build)（静态生成） |
| 语言 | TypeScript |
| 样式 | Tailwind CSS + @tailwindcss/typography |
| 内容 | Astro Content Collections（Markdown / JSON） |
| 搜索 | Pagefind |
| 评论 | Giscus |
| 统计 | Umami Cloud |
| 部署 | Vercel（push 即自动构建上线） |

## 项目结构

```
├── src/
│   ├── content/          # 内容（全部走 Git 管理）
│   │   ├── posts/        # 文章与系列笔记（Markdown）
│   │   ├── series/       # 系列元数据（JSON）
│   │   ├── resources/    # 资源收藏（JSON）
│   │   └── projects/     # 项目信息（JSON）
│   ├── pages/            # 路由页面
│   ├── layouts/          # 页面布局
│   ├── components/       UI 组件
│   └── utils/            # 工具函数（阅读时长、系列等）
├── public/               # 静态资源（头像、favicon）
└── astro.config.mjs      # Astro 配置
```

## 本地开发

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # 构建到 dist/（含 Pagefind 索引）
```

环境变量参考 `.env.example`（Giscus / Umami 配置，值在 Vercel 后台）。

## 相关文档

- [`DEPLOYMENT.md`](./DEPLOYMENT.md) — 部署方案设计
- [`MAINTENANCE.md`](./MAINTENANCE.md) — 运维手册（工作流 / 数据分析 / 域名 / 评论管理）
