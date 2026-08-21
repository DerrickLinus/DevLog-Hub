# DevLog Hub 运维手册

> 面向站长（自己）的长期维护手册：日常工作流、数据查看、域名升级、评论管理。
> 线上地址：https://dlhblog.com · 仓库：DerrickLinus/DevLog-Hub

---

## 1. 日常工作流（写作 → 发布）

```bash
# ① 写内容（见下方「内容速查」）
# ② 本地预览
npm run dev            # http://localhost:4321

# ③ 满意后发布
git add .
git commit -m "post: 文章标题"
git push               # 已设追踪，不用写 origin main

# ④ Vercel 约 1 分钟后自动构建上线，无需手动操作
```

- **Git 推送**依赖本地代理（`127.0.0.1:7890`，已配置在仓库本地 git config）。换电脑后需重新执行：
  ```bash
  git config --local http.proxy http://127.0.0.1:7890
  git config --local https.proxy http://127.0.0.1:7890
  ```
- **换电脑**：`git clone` → `npm install` → 复制 `.env`（被 gitignore，不在仓库里，内容见 `.env.example` + Giscus/Umami 各 ID）。

### 内容速查

| 要发布什么 | 放哪里 | 关键字段 |
|---|---|---|
| 独立技术文章 | `src/content/posts/xxx.md` | `title/description/date/tags/type: article` |
| 系列笔记 | `src/content/posts/系列名/epNN-标题.md` | 额外加 `series: 系列名` + `seriesOrder: N` |
| 新系列 | `src/content/series/系列名.json` | `title/description/status: ongoing|completed/order` |
| 资源收藏 | `src/content/resources/xxx.json` | `title/url/description/category/featured` |
| 项目 | `src/content/projects/xxx.json` | `name/summary/techStack/repoUrl/demoUrl` |
| 个人信息 | `src/data/profile.ts` | 名字/简介/头像/社交链接/技能 |

---

## 2. 定期查看的数据

### Google Search Console（搜索表现）— 每周或每两周
地址：https://search.google.com/search-console
- **效果报告**：哪些关键词搜到了你、展示/点击次数、平均排名
- **索引 → 页面**：哪些页面被 Google 收录了（新文章一般 1–3 天后出现）
- **站点地图**：sitemap 状态是否正常（已提交 `sitemap-index.xml`）

### Umami（访问统计）— 随时
地址：https://cloud.umami.is
- **访客/浏览量**：每日趋势、最近 24h
- **页面**：哪篇文章最热门
- **来源（Referrers）**：访客从哪来（Google/直接访问/别人博客的友链）
- **国家/设备**：读者画像

### Vercel（部署状态）— 出问题时看
地址：https://vercel.com/dashboard
- Deployments 列表：每次 push 对应一次部署，失败会标红并显示日志
- 用途：push 后线上没更新时，先来这里看构建是否成功

### GitHub Discussions（评论）— 收到邮件通知时看
地址：https://github.com/DerrickLinus/DevLog-Hub/discussions
- 读者在网站文章页发的评论，都存在这里（Announcements 分类）
- 需要开启通知：仓库页右上 **Watch → Custom → 勾选 Discussions**，新评论会发邮件到 GitHub 绑定的邮箱

---

## 3. 评论管理（Giscus）

**通知**：开启上述 Watch 设置后，有人评论 → GitHub 发邮件通知（发到 GitHub 账号设置的主邮箱）。

**回复**：两种方式等价（同一份数据，网站实时同步显示）：
1. 直接在 GitHub Discussion 里回复（推荐，不用再登录网站的 OAuth）
2. 在网站文章底部评论区回复（需用 GitHub 登录）

**删除评论**：在 GitHub Discussion 中操作——
- 删单条：评论右上 `···` → Delete
- 删整串：进入该 discussion → 右下 `···`（或底部 Delete discussion）→ 删除后网站上同步消失
- 你是仓库所有者，有权删任何人的评论；网站端刷新即可看到删除结果

> 注意：Giscus 以 `pathname` 映射讨论串——改文章的文件名/URL 会导致旧评论「失联」（数据还在 Discussions 里，只是不再显示在新 URL 页面下）。发布后尽量不改文章 slug。

---

## 4. 以后购买域名（可选）

**现在不买也完全可用**，`dev-log-hub.vercel.app` 全球可访问。想升级时再看这节。

### 在哪买
| 注册商 | 价格参考 | 说明 |
|---|---|---|
| [Cloudflare Registrar](https://www.cloudflare.com) | 成本价（.com 约 $10/年） | 无套路无溢价续费，推荐 |
| [Namecheap](https://www.namecheap.com) | 首年常有优惠 | 老牌，界面友好 |
| 阿里云/腾讯云 | 便宜的 .cn 需备案 | Vercel 在境外**不需要备案**；买国际域名也不必在国内买 |

选个短的：`devloghub.com` / `denglinhui.dev`（.dev 约 $12/年，带 HTTPS 强制）等。

### 买好后要改的清单（按顺序）
1. **Vercel 绑域名**：Dashboard → 项目 → Settings → Domains → Add，输入买的域名，按提示去注册商添加 DNS 记录（通常是一条 `CNAME` 指向 `cname.vercel-dns.com`，或 `A` 记录指向 `76.76.21.21`），等 DNS 生效（几分钟到几小时）
2. **`astro.config.mjs`**：`site: 'https://dev-log-hub.vercel.app'` → `site: 'https://你的域名'`，同时改 `public/robots.txt` 里的 sitemap 地址 → commit + push
3. **Umami**：Website 设置里把 Domain 改成新域名（website-id 不变，不用改环境变量）
4. **Google Search Console**：添加新域名作为新资源（域名级验证用 DNS TXT 记录）→ 重新提交 sitemap；旧资源可保留
5. （可选）Vercel 里把 `vercel.app` 旧地址 301 重定向到新域名（Domains 设置里自动提供）

---

## 5. 其他维护事项

- **升级依赖**：隔几个月 `npm outdated` 看看，小版本直接 `npm update`；Astro 大版本（6/7）升级前看官方迁移指南——本项目特意锁在 Astro 5
- **备份**：整个网站就是 Git 仓库，`git clone` 即完整备份（含全部文章）；图片在 `public/` 也会一起提交
- **删掉示例内容**（确认不需要后）：`example-post.md`、`example-project.json`
- **环境变量对照**：本地 `.env` ↔ Vercel Settings → Environment Variables，两边应保持一致（Giscus ×4、Umami ×2、SITE_URL）
