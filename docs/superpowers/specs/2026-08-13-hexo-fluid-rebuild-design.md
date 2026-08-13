# Hexo + Fluid 重建设计

日期：2026-08-13  
仓库：`FlyingPigQAQ/flyingpigqaq.github.io`

用最新 Hexo 和 Fluid 主题重建个人博客「想飞的猪猪」。不再使用 Icarus。源码进 Git，GitHub Actions 生成并发布到 GitHub Pages。

## 目标与非目标

**要做**

- 在同仓用 Hexo 8 + `hexo-theme-fluid` 重建站点
- 从现有 HTML 抽出 9 篇旧文为 Markdown（不要求旧 permalink）
- `whoami` 做成关于页 `/about/`
- `source` 分支存源码；推送后 Actions 把 `public/` 推到 `master`
- 自定义域名为 `blog.pigcanfly.top`
- 更新 `AGENTS.md`，使其描述源码仓而不是「只有发布产物」

**不做（本轮）**

- Icarus 或其它主题
- 评论系统
- 不蒜子、百度推送
- EdgeOne / 腾讯云对接
- `www.pigcanflyqaq.com` 跳转或保留
- 强制保持旧文章 URL

## 仓库与发布

```
source  ── hexo generate ──► master（仅 public/ 内容）
  ▲                              │
  │ Git 源码                     │ GitHub Pages
  │ Actions 触发                 ▼
  └────────────────     https://blog.pigcanfly.top
```

| 分支 | 内容 | 谁写 |
| --- | --- | --- |
| `source` | Hexo 源码、主题依赖、工作流、文章 Markdown | 人手 / Agent |
| `master` | `hexo generate` 的静态文件 + `CNAME` | 仅 GitHub Actions |

GitHub Pages 继续选择「从 `master` 分支根目录发布」。不把生成 HTML 提交进 `source`。

`source` 上 `.gitignore` 至少包含：`node_modules/`、`public/`、`db.json`、`.DS_Store`、`.superpowers/`。

## 技术选型

- Node.js 22（Actions 与本地一致）
- Hexo 8.x（`hexo-cli` 初始化）
- 主题：`hexo-theme-fluid`（npm 安装，不 fork 进 `themes/`）
- 本地搜索：Fluid 自带
- 代码高亮：Hexo / Fluid 默认
- 部署 Action：在 `source` 上 `npm ci` → `npx hexo generate` → 将 `public/` 推送到 `master`（force 覆盖旧站）

站点配置要点：

- `title`：想飞的猪猪
- `language`：zh-CN
- `url`：`https://blog.pigcanfly.top`
- `theme`：fluid
- 导航：首页、归档、分类、标签、关于
- 在 `source/CNAME` 写入一行 `blog.pigcanfly.top`。Hexo 会把它复制进 `public/`，从而出现在 `master`。

Fluid 侧栏保留资料卡；头像使用现有 `images/avatar.jpeg` 或 `avatar.png`，拷入 `source`。

## 内容迁移

从当前 `master` 的 HTML 抽出，写入 `source/_posts/`。Front-matter 含 `title`、`date`、原分类、原标签。正文转为 Markdown；配图放到 `source/img/`（或 `source/_posts` 同目录），链接改成新站点路径。

现有 9 篇：

1. Hello-World
2. 国内镜像源集合
3. Top命令参考指南
4. nexus搭建maven和npm私服
5. Unicode编码表
6. Docker2Mysql
7. Github利器之Travis
8. SSH安装操作系统
9. FailedConnectraw-githubusercontent-com

`whoami/index.html` 转为 `source/about/index.md`，front-matter 使用 Fluid 关于页约定：`title: 关于`、`layout: about`。不迁移 Gitalk 配置和密钥。

Permalink 使用 Hexo 默认（例如 `:year/:month/:day/:title/`），不兼容旧链接。

## GitHub Actions

工作流文件：`source` 分支 `.github/workflows/deploy.yml`

触发：`push` 到 `source`，以及手动 `workflow_dispatch`。

步骤：

1. `actions/checkout@v4`
2. `actions/setup-node@v4`，Node 22，缓存 npm
3. `npm ci`
4. `npx hexo generate`
5. 将 `public/` 推到 `master`（保留 `CNAME`）

权限：`contents: write`。不在工作流或仓库文件里写入云厂商 Token。

首次成功后，`master` 上的 Icarus HTML 被整站替换。这是预期行为。

## 域名（需你本地完成）

Agent 无法改 DNS。上线前你需要：

1. 给 `blog.pigcanfly.top` 添加 CNAME，指向 `flyingpigqaq.github.io`
2. 在仓库 Settings → Pages 填写自定义域名 `blog.pigcanfly.top` 并开启 HTTPS
3. 确认该域名已按你的计划备案或仅走 Pages 默认节点

旧域名 `www.pigcanflyqaq.com` 本轮不配置、不跳转。仓库根目录不再使用旧 CNAME。

## 本地开发

在 `source` 分支：

```bash
npm ci
npx hexo s
```

浏览器打开 `http://localhost:4000`。改文章或主题配置后刷新即可。不要在 `master` 上改生成文件。

## 验证

- 本地 `hexo generate` 成功，`public/index.html` 为 Fluid 页面（不是 Icarus）
- 9 篇文章和关于页都能打开，图能显示
- 搜索能搜到旧文标题
- Actions 绿，`master` 仅含静态站点
- 访问 `https://blog.pigcanfly.top`（DNS 生效后）看到新站

无单元测试。以生成为准、以浏览器抽查为准。

## 风险

- 推到 `master` 会立刻替换现站。先在本地 `hexo s` 看过再推 `source`。
- GitHub Pages 自定义域名未填对时，CNAME 文件会被 Pages 改回。部署步骤必须写出 `blog.pigcanfly.top`。
- Unicode 那篇 HTML 很大，抽取时可能有表格/编码丢失，需人工抽查。

## 范围边界

一次实施计划即可覆盖：初始化 Hexo、装 Fluid、迁文、工作流、改 AGENTS.md、首次部署。EdgeOne、评论、旧域名跳转另开任务。
