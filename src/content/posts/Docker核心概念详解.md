---
title: Docker 核心概念详解：从镜像到 Compose 的一次彻底梳理
description: 从零讲清 Docker 的四个核心概念（镜像、容器、Docker 引擎、Compose）。
date: 2026-08-28
tags: [Docker, 环境配置]
category: article
type: article
pinned: false
draft: false
lang: zh
---

> 一次装完 Docker，处处都能运行。—— Docker 的核心承诺
>
> 本文从零讲清 Docker 的四个核心概念（镜像、容器、Docker 引擎、Compose），并以开源知识库平台 WeKnora 的真实部署为例，覆盖从"使用别人的镜像"到"打包自己的项目"的完整链路。适合有一定开发经验但刚接触容器的读者。

## 为什么需要 Docker

先看没有 Docker 的世界里，"跑起来一个别人的项目"意味着什么：

1. 按文档安装指定版本的运行时（"仅支持 Python 3.11，3.12 会报错"）；
2. 安装一堆系统级依赖（`libsqlite3-dev`、`build-essential`……）；
3. 处理依赖冲突：这个项目要 PostgreSQL 14，你机器上已经装了 16；
4. 如果是编译型语言，还得装整套工具链，然后祈祷编译一次通过。

这套流程的痛苦有个专门的段子——在我电脑上能跑，怎么换台电脑就不行了。其根源在于：**应用的运行环境（运行时、依赖库、系统工具、配置）散落在宿主机的各个角落，没有被应用一起分发**。

Docker 的解法很直接：**把应用连同它的完整运行环境一起，打成一个标准格式的包（镜像），分发、运行这个包即可**。用户机器上唯一需要安装的软件是 Docker 本身。

## 四个核心概念总览

先用一张表建立全局认知，后文逐个展开：

| 概念               | 一句话定义                | 类比          |
| ---------------- | -------------------- | ----------- |
| **镜像 Image**     | 包含应用及其完整运行环境的只读模板    | 菜谱 + 预制料理包  |
| **容器 Container** | 镜像运行起来的隔离实例          | 按料理包做出来的一盘菜 |
| **Docker 引擎**    | 构建、运行、管理镜像和容器的软件     | 厨房          |
| **Compose**      | 用一个 YAML 文件声明并编排多个容器 | 一整套宴席的流程单   |
 
关系链：

```
Dockerfile（打包说明书）
   │  docker build
   ▼
镜像 Image（只读模板，可分发）
   │  docker run / docker compose up
   ▼
容器 Container（运行实例，可创建、销毁、重建）
```

## 镜像 Image：只读的分发模板

镜像是 Docker 世界的"分发单位"。一个镜像内部包含了运行某个应用所需的**一切**：精简的操作系统文件层、语言运行时（Python / Go / Node）、第三方依赖库、应用代码和启动命令。

三个关键特性：

**1. 只读（immutable）**

镜像一旦构建完成，内容永远不会变。要修改就得构建新版本（通常打新 tag）。不可变性带来了分发的可靠性：同一个 `postgres:16` 镜像，在任何机器上解开后都是完全一致的内容，"环境不一致"问题从根上消失。

**2. 分层（layered）**

镜像不是一整块，而是由多个只读层叠加而成，类似千层饼：

```
┌─────────────────────────────┐
│  你的应用代码                 │  ← Dockerfile: COPY . .
├─────────────────────────────┤
│  pip install 的依赖包         │  ← Dockerfile: RUN pip install ...
├─────────────────────────────┤
│  Python 3.12 运行时          │  ← FROM python:3.12-slim
├─────────────────────────────┤
│  Debian Linux 基础文件层      │  ← 基础镜像
└─────────────────────────────┘
```

每条 Dockerfile 指令（`COPY`、`RUN`……）生成一层。分层带来两个实际好处：

- **存储与下载复用**：两个都用 `python:3.12-slim` 做底座的镜像，底层只需在磁盘上存一份；本地已有底层、只更新顶层时，`docker pull` 只下载变化的层。
- **构建缓存**：某层的内容没变，构建时直接复用缓存。这就是 Dockerfile 里"先 `COPY requirements.txt` 装依赖、后 `COPY . .` 拷代码"这一顺序约定的原因——改一行代码不必重新下载几百 MB 依赖。

**3. 可复用（一个模板，N 个实例）**

同一个镜像可以同时启动任意多个容器，彼此完全隔离，就像一个模具压出 N 块月饼。

镜像的命名格式为 `仓库名:标签`，例如 `postgres:16`、`nginx:latest`。标签不写时默认 `latest`。

## 容器 Container：镜像的运行实例

镜像是"死的"模板，容器是"活的"进程。`docker run nginx` 做的事情：以 nginx 镜像为模板，创建一个隔离的运行环境并启动其中的程序。

**隔离性**：每个容器拥有独立的文件系统视图、进程空间和网络栈。容器里的应用以为自己在独占一台机器，互相之间不可见。底层实现依赖 Linux 内核的 namespace（隔离视图）和 cgroups（限制资源）技术——Docker 的核心贡献不是发明这些内核机制，而是把它们封装成了普通人能用的工具。

**可写层**：容器在镜像的所有只读层之上，附加一个薄薄的可写层。程序运行时的写操作都落在这里。**容器被删除时，可写层随之销毁**——重要数据（数据库文件、上传的文件）必须通过"卷（volume）"挂载到容器外部持久化，否则删容器等于删数据。

**生命周期**：创建 → 启动 → 停止 → 删除，全程秒级。这带来一种全新的部署哲学：**容器是可抛弃的（disposable）**。应用出了问题时，就不必像传统运维那样小心翼翼地修复，直接删掉容器、从镜像重新起一个干净的。因为镜像是只读的，重建后的容器必然回到已知的良好状态。

镜像与容器的关系，精确定义是**类与实例**的关系：

```
镜像 nginx（模板）
   ├── docker run ──▶ 容器 A（实例，端口 8080）
   ├── docker run ──▶ 容器 B（实例，端口 8081，与 A 互不干扰）
   └── docker run ──▶ 容器 C（实例，改了配置文件，只影响 C 自己）
```

## Docker 引擎：一切的底座

Docker 引擎是安装在宿主机上的软件，承担两大职责：

1. **打包**：执行 Dockerfile，把应用构建成镜像；
2. **运行**：把镜像实例化为容器，并负责隔离、网络、存储卷、资源限制等底层工作。

日常打交道的是它的 CLI。最小命令集：

```bash
# 镜像操作
docker pull nginx              # 从仓库下载镜像
docker images                  # 列出本地镜像
docker rmi nginx               # 删除镜像

# 容器操作
docker run -d --name my-nginx -p 8080:80 nginx   # 从镜像创建并启动容器
docker ps                      # 列出运行中的容器（-a 含已停止的）
docker stop / start / rm       # 停止 / 启动 / 删除容器
docker logs -f my-nginx        # 跟踪容器日志
docker exec -it my-nginx bash  # 进入容器内部排查问题
```

两个参数：

- `-d`（detached）：后台运行，不占用当前终端；
- `-p 8080:80`（publish）：端口映射，把宿主机的 8080 转发到容器内的 80。容器有自己独立的网络栈，不做映射的话宿主机（及局域网）访问不到容器里的服务。

## Compose：多容器的总指挥

真实系统很少只有一个容器。以 WeKnora 为例，完整服务包含：前端（Nginx）、后端 app（Go）、PostgreSQL、向量数据库 Milvus、Redis……它们之间还有依赖关系——必须等数据库就绪，后端才能成功连接。

用裸 `docker run` 手工管理这组容器，意味着：记住七八条带十几个参数的长命令、手动保证启动顺序、手工创建容器间通信网络。可行，但脆弱且不可复现。

Compose 的解法：**把"这组容器如何运作"完整声明在一个 YAML 文件里**（`docker-compose.yml`），一个服务一条：

```yaml
services:
  app:
    build:
      context: .
      dockerfile: docker/Dockerfile.app
    ports:
      - "8080:8080"
    environment:
      - LOG_LEVEL=debug
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - data-files:/data/files

  postgres:
    image: postgres:16
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  data-files:
  pgdata:
```

然后所有操作都以"整组"为单位：

```bash
docker compose up -d        # 按依赖顺序启动全部服务（后台）
docker compose ps           # 查看本组容器状态
docker compose logs -f app  # 跟踪某个服务的日志
docker compose stop         # 整组停止（容器保留，可 start 唤醒）
docker compose down         # 整组删除（容器和网络移除，数据卷默认保留）
docker compose up -d --build  # 重新构建镜像并替换变动的容器
```

几个机制值得注意：

- **项目名（project name）**：默认取自目录名，WeKnora 指定为 `weknora`。Compose 用它统一命名容器（`weknora-app-1`，格式为 `项目名-服务名-序号`）并创建专属网络——这就是为什么容器列表界面里 WeKnora 显示为一个可折叠的分组。
- **服务名即主机名**：同一 compose 网络内，`app` 连数据库直接写 `postgres:5432`，Compose 内置 DNS 自动解析到对应容器。 IP 是多少完全不用关心。
- **`depends_on` + `healthcheck`**：声明"等 postgres 健康检查通过后再启动 app"，解决启动顺序竞态。
- **`up -d` 是幂等的**：它的语义是"让这组容器达到 yml 声明的期望状态"，而非"从零启动一次"。已符合期望的容器不动；配置或镜像变了的容器自动替换。日常改配置、更新代码后重新部署，都是再敲一遍 `docker compose up -d`。

## 实例：WeKnora 是怎么被部署起来的

把前文概念放到一个真实项目里串一遍。WeKnora 是腾讯开源的知识库/RAG 平台，它的仓库里恰好同时示范了镜像分发的两条路径。

**作为使用者**，部署只需三步：

```bash
git clone https://github.com/WeKnora/WeKnora.git
cd WeKnora && cp config/.env.example .env   # 填入 LLM API key 等
docker compose up -d
```

打开浏览器访问宿主机 80 端口，完整的知识库平台就跑起来了。过程中没有安装 Go、没有安装 Node、没有配置 PostgreSQL——**镜像就是运行环境**。

**镜像从哪来**：WeKnora 团队在自己的机器上执行 `docker build`，把前后端分别构建成镜像 `wechatopenai/weknora-app` 和 `wechatopenai/weknora-ui`，推送到 Docker Hub。用户 `docker compose up -d` 时自动拉取。

**`git clone` 拿源码是为了编译吗**：不是。编译（Go 源码 → 二进制）在维护者构建镜像时就已完成，用户拉到的镜像里躺的是编译产物。用户 clone 源码只是为了拿到 `docker-compose.yml`、`.env.example`、`config.yaml` 这几个"部署说明文件"。理论上如果维护者单独分发这几个文件，使用者根本不需要源码。

## 如何让自己的项目可 Docker 部署

让自己的项目获得同样"一条命令部署"的体验，分四步。

### 第一步：写 Dockerfile

一个 Python Web 项目的典型 Dockerfile：

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Go 等编译型语言推荐**多阶段构建（multi-stage build）**——构建阶段用完整工具链编译，运行阶段只带走编译产物：

```dockerfile
# ── 构建阶段：带完整 Go 工具链，用完即弃 ──
FROM golang:1.26-bookworm AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN make build-prod

# ── 运行阶段：干净的精简底座，只拷贝产物 ──
FROM debian:12-slim
WORKDIR /app
RUN useradd -m appuser
COPY --from=builder /app/bin/myapp /app/
USER appuser
CMD ["./myapp"]
```

好处是最终镜像不包含编译器、源码和构建历史，体积从 GB 级降到几十 MB，攻击面也更小。

### 第二步：写 .dockerignore

作用类似 `.gitignore`，排除不需要进镜像的文件：

```
.git/
__pycache__/
venv/
.env
*.md
```

**`.env` 必须排除**——密钥一旦打进镜像并推送，等于公开发布。

### 第三步：本地验证后发布到镜像仓库

```bash
docker build -t yourname/myapp:1.0 .
docker run --rm -p 8000:8000 yourname/myapp:1.0   # 验证能跑
docker login
docker push yourname/myapp:1.0
```

Docker Hub 是最大的公共仓库；GitHub Container Registry（`ghcr.io`）与 GitHub 集成好，国内也可选阿里云 ACR、腾讯云 TCR。

### 第四步：提供 compose 文件和配置模板

WeKnora 的 compose 文件里有几个值得直接抄的约定：

```yaml
services:
  app:
    # 两条都写：普通用户走 image 直接拉；二开用户 --build 从源码构建
    image: yourname/myapp:${MYAPP_VERSION:-latest}
    build:
      context: .
    ports:
      - "${APP_PORT:-8000}:8000"      # 端口可配置且带默认值
    env_file:
      - .env                           # 每个用户不同的配置（API key 等）走 .env 注入
    volumes:
      - app-data:/app/data             # 数据落卷，容器删了数据还在

volumes:
  app-data:
```

核心原则：**镜像保持通用，用户差异全部外置**——通过 `.env` 注入环境变量、通过挂载覆盖配置文件。配合仓库里的 `.env.example` 模板，用户的完整部署体验就是三行命令。

## 一些问题

**Q：镜像里的运行时和依赖，是什么时候装到我电脑上的？**

不是启动容器时。维护者构建镜像时就已经装好并"焊"进镜像层； `docker pull` 的那一刻，包含这一切的完整镜像一次性下载到本地（存放在 Docker 管理的隔离存储区，如 Linux 的 `/var/lib/docker`）。之后启动容器不发生任何安装动作，这就是容器能秒级启动的原因。并且这些内容**不会进入系统环境**：即系统里不会多出全局 Python，宿主机已有的依赖也不受影响，这也是多个项目能各自用不同版本运行时共存的原因。

**Q：拉镜像使用，能看到源码吗？**

一般不能。编译型语言（Go/C++/Rust）的镜像里只有二进制，无法阅读或修改；解释型语言（Python/JS）的镜像里文件虽是文本，但也只是"解剖成品"，且前端 JS 通常已压缩混淆。镜像和源码是两条独立的分发渠道：镜像分发给使用者，代码仓库分发给二开者。开源项目两条渠道都开放，闭源软件则只有镜像。

**Q：compose 里 `image` 和 `build` 都写了，到底用哪个？**

`docker compose up -d` 默认走 `image`（本地已有同名镜像则复用）；加 `--build` 走 `build`，用本地源码现场构建镜像（构建结果打上 `image` 声明的名字）。所以：**使用者走默认，二开改完代码走 `--build`**。

**Q：`docker compose stop` 之后再 `start`，改过的 yml 生效吗？**

不生效。`start` 只是唤醒旧容器，不会应用新配置。改过 `docker-compose.yml` 后要重新 `up -d`，让 Compose 重建有变化的容器。

**Q：`docker ps` 和 `docker compose ps` 的区别？**

`docker ps` 看的是宿主机上**所有**容器（不限来源）；`docker compose ps` 只看当前目录 compose 项目里的容器，需在 compose 文件所在目录运行。两者加 `-a` 都可以显示已停止的容器。

## 总结

- **Docker 解决的问题**：把应用的完整运行环境（运行时、依赖、系统工具）连同应用本身打包成标准化单元，从此"环境"跟着应用一起分发，用户只需装 Docker 本身。
- **镜像**是只读的分层模板，**容器**是它的隔离运行实例（类与实例）；容器可抛弃、可秒级重建，数据通过卷外置持久化。
- **Docker 引擎**负责打包与运行，**Compose** 负责把多容器系统声明成一个 YAML 文件，实现幂等的一条命令编排。
- **分发链路**：维护者写 Dockerfile → `build` 出镜像 → `push` 到仓库 → 使用者 `docker compose up -d` 拉取并运行。源码不是部署的必需品，只是二开的入口。
- **让自己的项目可部署**：Dockerfile（多阶段构建、依赖层前置）+ `.dockerignore`（排除密钥）+ 发布镜像 + compose 文件与 `.env` 模板（用户差异全部外置）。

一个曾困扰我许久的理解偏差，最后单独点出来：**容器不是轻量级虚拟机**。虚拟机虚拟的是整台计算机（含内核），分钟级启动，GB 级开销；容器只是被内核隔离起来的普通进程，共享宿主内核，秒级启动，MB 级开销。把容器理解为"被圈起来的进程"，比"小虚拟机"更接近本质。
