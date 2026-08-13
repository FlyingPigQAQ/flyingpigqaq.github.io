# Hexo Fluid 重建 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在同仓用 Hexo 8 + Fluid 重建「想飞的猪猪」，源码在 `source` 分支，Actions 生成并覆盖 `master`，域名 `blog.pigcanfly.top`。

**Architecture:** 从当前 `master`（Icarus 静态站）建 orphan 分支 `source`，在上面 `hexo init`。旧文用 `git show master:<path>` 抽出 Markdown。推送 `source` 时 GitHub Actions 执行 `hexo generate`，把 `public/` 推到 `master`。GitHub Pages 继续发布 `master`。

**Tech Stack:** Node 22、Hexo 8、hexo-theme-fluid、hexo-generator-search、peaceiris/actions-gh-pages、GitHub Pages。

## Global Constraints

- 主题必须是 Fluid，禁止 Icarus。
- 站点名 `想飞的猪猪`，语言 `zh-CN`，URL `https://blog.pigcanfly.top`。
- 源码只在 `source`；`master` 只由 Actions 写入生成结果。
- 本轮不要评论、不蒜子、百度推送、EdgeOne。
- 旧域名 `www.pigcanflyqaq.com` 不配置、不跳转。
- 旧 permalink 不兼容；Hexo 默认 `:year/:month/:day/:title/`。
- Node 22。`.gitignore` 必须包含 `node_modules/`、`public/`、`db.json`、`.DS_Store`、`.superpowers/`。
- 不把 Gitalk `clientSecret` 写进任何新文件。
- 用户对话与提交说明用中文；提交信息说明「为什么」。

## File map（`source` 分支）

| 路径 | 职责 |
| --- | --- |
| `_config.yml` | Hexo 站点配置 |
| `_config.fluid.yml` | Fluid 主题覆盖 |
| `package.json` / `package-lock.json` | 依赖锁定，供 `npm ci` |
| `.gitignore` | 忽略生成物与依赖 |
| `source/CNAME` | `blog.pigcanfly.top` |
| `source/_posts/*.md` | 9 篇旧文 |
| `source/about/index.md` | 关于页 |
| `source/img/` | 头像、favicon、文章配图 |
| `.github/workflows/deploy.yml` | 生成并推 `master` |
| `AGENTS.md` | Agent 说明（源码仓） |
| `docs/superpowers/` | 设计与本计划（从 master 拷来） |
| `scripts/extract-posts.mjs` | 一次性从 master HTML 抽 Markdown |

---

### Task 1: 建立 `source` orphan 分支并初始化 Hexo

**Files:**
- Create: `_config.yml`（hexo init 生成后改）
- Create: `package.json`（hexo init 生成）
- Create: `.gitignore`
- Create: `docs/superpowers/specs/2026-08-13-hexo-fluid-rebuild-design.md`（从 master 拷贝）
- Create: `docs/superpowers/plans/2026-08-13-hexo-fluid-rebuild.md`（本文件）

**Interfaces:**
- Consumes: 当前 `master` 提交（含设计文档）
- Produces: 可工作的空 Hexo 站点；分支名必须是 `source`

- [ ] **Step 1: 确认当前在 master 且工作区干净（除已约定不提交的文件）**

```bash
git checkout master
git status
node -v   # 必须是 v22.x
```

Expected: 在 `master`。若 Node 不是 22，用 nvm/fnm 切到 22 再继续。`.superpowers/` 和未提交的 `AGENTS.md` 不要带进 orphan。

- [ ] **Step 2: 创建 orphan 分支并清空已跟踪文件**

```bash
git checkout --orphan source
git rm -rf --cached .
```

不要 `git clean -fd` 直到 Step 4 拷完文档；先把设计/计划复制到临时目录：

```bash
mkdir -p /tmp/hexo-rebuild-docs/specs /tmp/hexo-rebuild-docs/plans
git show master:docs/superpowers/specs/2026-08-13-hexo-fluid-rebuild-design.md \
  > /tmp/hexo-rebuild-docs/specs/2026-08-13-hexo-fluid-rebuild-design.md
cp docs/superpowers/plans/2026-08-13-hexo-fluid-rebuild.md \
  /tmp/hexo-rebuild-docs/plans/2026-08-13-hexo-fluid-rebuild.md
```

若计划此时还不在工作区，从你正在编辑的路径复制。然后：

```bash
git clean -fd -e docs -e .superpowers
```

- [ ] **Step 3: hexo init 到当前目录**

```bash
npx hexo-cli init .
```

Expected: 生成 `_config.yml`、`package.json`、`source/_posts/hello-world.md`、`scaffolds/`。若目录非空导致 init 失败，在空临时目录 init 再把文件移回来。

- [ ] **Step 4: 写 `.gitignore` 并拷回文档**

`.gitignore` 全文：

```
.DS_Store
Thumbs.db
db.json
*.log
node_modules/
public/
.deploy*/
.superpowers/
```

```bash
mkdir -p docs/superpowers/specs docs/superpowers/plans
cp /tmp/hexo-rebuild-docs/specs/2026-08-13-hexo-fluid-rebuild-design.md docs/superpowers/specs/
cp /tmp/hexo-rebuild-docs/plans/2026-08-13-hexo-fluid-rebuild.md docs/superpowers/plans/
```

- [ ] **Step 5: 验证脚手架能生成**

```bash
npm install
npx hexo generate
test -f public/index.html
```

Expected: 退出码 0，`public/index.html` 存在。

- [ ] **Step 6: Commit**

```bash
git add .gitignore _config.yml package.json package-lock.json scaffolds source docs
git add -u
git commit -m "$(cat <<'EOF'
chore: init Hexo 8 on source branch

Give the blog a real source tree instead of generated Icarus HTML.
EOF
)"
```

不要 `git add public` 或 `node_modules`。

---

### Task 2: 安装 Fluid 与本地搜索并写站点配置

**Files:**
- Modify: `package.json`（npm 写入 hexo-theme-fluid、hexo-generator-search）
- Modify: `_config.yml`
- Create: `_config.fluid.yml`

**Interfaces:**
- Consumes: Task 1 的 Hexo 脚手架
- Produces: `theme: fluid`；搜索索引路径 `/local-search.xml`；导航含 about

- [ ] **Step 1: 安装依赖**

```bash
npm install --save hexo-theme-fluid hexo-generator-search
```

Expected: `package.json` 的 `dependencies` 含这两个包。

- [ ] **Step 2: 修改 `_config.yml` 这些键（其余 hexo init 默认可留）**

```yaml
title: 想飞的猪猪
subtitle: '想飞的猪er~'
description: 'FlyingPigQAQ 的个人博客'
keywords:
author: FlyingPigQAQ
language: zh-CN
timezone: 'Asia/Shanghai'
url: https://blog.pigcanfly.top
permalink: :year/:month/:day/:title/
theme: fluid
```

关闭 Hexo 自带 highlight（交给 Fluid）：

```yaml
highlight:
  enable: false
prismjs:
  enable: false
```

`_config.yml` 里不要设 `theme_config` 大段覆盖；主题用 `_config.fluid.yml`。

- [ ] **Step 3: 生成 `_config.fluid.yml`**

```bash
cp node_modules/hexo-theme-fluid/_config.yml _config.fluid.yml
```

然后只改这些值（文件其余保持主题默认）：

```yaml
navbar:
  blog_title: "想飞的猪猪"
  menu:
    - { key: "home", link: "/", icon: "iconfont icon-home-fill" }
    - { key: "archive", link: "/archives/", icon: "iconfont icon-archive-fill" }
    - { key: "category", link: "/categories/", icon: "iconfont icon-category-fill" }
    - { key: "tag", link: "/tags/", icon: "iconfont icon-tags-fill" }
    - { key: "about", link: "/about/", icon: "iconfont icon-user-fill" }

search:
  enable: true
  path: /local-search.xml
  generate_path: /local-search.xml
  field: post
  content: true

index:
  slogan:
    enable: true
    text: "想飞的猪er~"

about:
  enable: true
  avatar: /img/avatar.png
  name: "FlyingPigQAQ"
  intro: "专注折腾，顺便写点笔记"
  icons:
    - { class: "iconfont icon-github-fill", link: "https://github.com/FlyingPigQAQ/", tip: "GitHub" }
```

确认 `_config.fluid.yml` 里评论相关 `enable` 为 `false`（主题默认即关，不要打开任何 gitalk/valine/waline/giscus）。

- [ ] **Step 4: 验证生成结果是 Fluid 不是 Icarus**

```bash
npx hexo clean && npx hexo generate
rg -n "hexo-theme-icarus|Icarus" public/index.html || true
rg -n "fluid" public/index.html | head
```

Expected: 没有 Icarus；`public/index.html` 含 fluid 的 class 或资源路径（例如 `fluid` / `iconfont`）。失败则检查 `theme: fluid` 是否生效。

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json _config.yml _config.fluid.yml
git commit -m "$(cat <<'EOF'
feat: switch theme to Fluid with local search

Replace Icarus with a maintained theme and enable Fluid search.
EOF
)"
```

---

### Task 3: 静态资源与 CNAME

**Files:**
- Create: `source/CNAME`
- Create: `source/img/avatar.png`（从 master 拷贝）
- Create: `source/img/favicon.png`（从 master 拷贝）
- Create: `source/img/` 下文章配图（`git show master:img/...`）

**Interfaces:**
- Consumes: `master` 上 `images/avatar.png`、`images/favicon.png`、`img/*`
- Produces: `source/CNAME` 内容恰好一行 `blog.pigcanfly.top`；头像路径与 `_config.fluid.yml` 的 `/img/avatar.png` 一致

- [ ] **Step 1: 写入 CNAME**

```bash
printf 'blog.pigcanfly.top\n' > source/CNAME
```

- [ ] **Step 2: 从 master 拷贝头像、favicon、文章图**

```bash
mkdir -p source/img
git show master:images/avatar.png > source/img/avatar.png
git show master:images/favicon.png > source/img/favicon.png
for f in contact_wechat.png github_readme.png nexus-1.png nexus-2.jpg nexus-3.png nexus-4.png nexus-5.png nexus-6.png nexus-7.png travis_building_pass.png; do
  git show "master:img/$f" > "source/img/$f"
done
file source/img/avatar.png source/img/favicon.png
```

Expected: `file` 显示 PNG/JPEG，不是空文件或 "ASCII text"。

- [ ] **Step 3: 把 Fluid 配置里的 favicon 指到新文件**

在 `_config.fluid.yml`：

```yaml
favicon: /img/favicon.png
apple_touch_icon: /img/favicon.png
```

- [ ] **Step 4: 验证 CNAME 进入 public**

```bash
npx hexo generate
test "$(cat public/CNAME)" = "blog.pigcanfly.top"
```

Expected: 退出码 0。

- [ ] **Step 5: Commit**

```bash
git add source/CNAME source/img _config.fluid.yml
git commit -m "$(cat <<'EOF'
feat: add site assets and custom domain CNAME

Point the rebuilt site at blog.pigcanfly.top and reuse existing images.
EOF
)"
```

---

### Task 4: 从 master HTML 抽出 9 篇 Markdown

**Files:**
- Create: `scripts/extract-posts.mjs`
- Create: `source/_posts/hello-world.md`
- Create: `source/_posts/国内镜像源集合.md`
- Create: `source/_posts/Top命令参考指南.md`
- Create: `source/_posts/nexus搭建maven和npm私服.md`
- Create: `source/_posts/Unicode编码表.md`
- Create: `source/_posts/Docker2Mysql.md`
- Create: `source/_posts/Github利器之Travis.md`
- Create: `source/_posts/SSH安装操作系统.md`
- Create: `source/_posts/FailedConnectraw-githubusercontent-com.md`
- Delete: hexo init 自带的 `source/_posts/hello-world.md`（若标题/日期不对，用抽出的覆盖）

**Interfaces:**
- Consumes: `git show master:YYYY/MM/DD/<slug>/index.html`
- Produces: 每篇 front-matter 含 `title`、`date`、`categories`、`tags`；正文 Markdown；图片链接为 `/img/<filename>`

- [ ] **Step 1: 写入抽取脚本 `scripts/extract-posts.mjs`**

```js
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import TurndownService from 'turndown';

const posts = [
  { path: '2019/02/02/Hello-World/index.html', file: 'hello-world.md' },
  { path: '2019/02/02/国内镜像源集合/index.html', file: '国内镜像源集合.md' },
  { path: '2019/02/26/Top命令参考指南/index.html', file: 'Top命令参考指南.md' },
  { path: '2019/03/15/nexus搭建maven和npm私服/index.html', file: 'nexus搭建maven和npm私服.md' },
  { path: '2019/03/26/Unicode编码表/index.html', file: 'Unicode编码表.md' },
  { path: '2019/05/15/Docker2Mysql/index.html', file: 'Docker2Mysql.md' },
  { path: '2019/05/16/Github利器之Travis/index.html', file: 'Github利器之Travis.md' },
  { path: '2019/08/16/SSH安装操作系统/index.html', file: 'SSH安装操作系统.md' },
  { path: '2020/04/20/FailedConnectraw-githubusercontent-com/index.html', file: 'FailedConnectraw-githubusercontent-com.md' },
];

const turndown = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });

function show(path) {
  return execFileSync('git', ['show', `master:${path}`], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
}

mkdirSync('source/_posts', { recursive: true });

for (const post of posts) {
  const html = show(post.path);
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  const title = doc.querySelector('h1.title, h1')?.textContent?.trim() || post.file.replace(/\.md$/, '');
  const time = doc.querySelector('time')?.getAttribute('datetime') || '';
  const categories = [...doc.querySelectorAll('.article-meta a[href*="/categories/"]')].map((a) => a.textContent.trim());
  const tags = [...doc.querySelectorAll('.article-tags a, .tag:not(.is-light)')].map((a) => a.textContent.trim()).filter((t) => t && t !== '标签');
  const contentEl = doc.querySelector('.content') || doc.querySelector('.article');
  if (!contentEl) throw new Error(`no content in ${post.path}`);
  contentEl.querySelectorAll('script, .gitalk, #comment-container').forEach((n) => n.remove());
  contentEl.querySelectorAll('img').forEach((img) => {
    const src = img.getAttribute('src') || '';
    const name = src.split('/').pop();
    if (name) img.setAttribute('src', `/img/${name}`);
  });
  const markdown = turndown.turndown(contentEl.innerHTML);
  const fm = [
    '---',
    `title: ${JSON.stringify(title)}`,
    `date: ${time}`,
    'categories:',
    ...(categories.length ? categories.map((c) => `  - ${c}`) : ['  - 未分类']),
    'tags:',
    ...(tags.length ? [...new Set(tags)].map((t) => `  - ${t}`) : []),
    '---',
    '',
    markdown.trim(),
    '',
  ].join('\n');
  writeFileSync(`source/_posts/${post.file}`, fm);
  console.log('wrote', post.file, title);
}
```

- [ ] **Step 2: 安装一次性抽取依赖（不写进博客运行时依赖）**

```bash
npm install --save-dev jsdom turndown
node scripts/extract-posts.mjs
```

Expected: 打印 9 行 `wrote ...`，`source/_posts/` 有 9 个 md（可另有 hexo 默认文，下一步删掉重复）。

- [ ] **Step 3: 删掉脚手架默认文章（若与抽出的 hello-world 重复则只保留抽出版）**

```bash
ls source/_posts
```

若存在 hexo 默认 `hello-world.md` 且内容是 "Hello World" 英文占位，用抽出版覆盖。不要留两篇 Hello World。

- [ ] **Step 4: 生成并核对篇数**

```bash
npx hexo clean && npx hexo generate
ls public/2019 public/2020
rg -l "想飞的猪猪" public/index.html
```

Expected: `public/2019` 与 `public/2020` 下有文章目录；首页能列出旧文标题（至少「SSH安装操作系统」「Unicode编码表」）。Unicode 页抽完后打开 `public/2019/03/26/Unicode编码表/index.html`，确认不是空正文。若分类/标签抽空，对照 `git show master:...` 手工补 front-matter。

- [ ] **Step 5: Commit**

```bash
git add scripts/extract-posts.mjs package.json package-lock.json source/_posts
git commit -m "$(cat <<'EOF'
feat: migrate nine posts from Icarus HTML to Markdown

Recover article content without depending on the lost Hexo source.
EOF
)"
```

---

### Task 5: 关于页

**Files:**
- Create: `source/about/index.md`

**Interfaces:**
- Consumes: `git show master:whoami/index.html` 的正文；Task 2 的 `about` 配置
- Produces: `/about/` 可访问，`layout: about`

- [ ] **Step 1: 创建页面骨架**

```bash
npx hexo new page about
```

- [ ] **Step 2: 覆盖 `source/about/index.md`**

从 `git show master:whoami/index.html` 取 `.content` 转 Markdown（可用 Task 4 同一套 turndown，或手工摘 About Me 段落）。front-matter 必须是：

```yaml
---
title: 关于
layout: about
---
```

正文用 Markdown 写自我介绍，**不要**包含 Gitalk 的 `clientID` / `clientSecret`。GitHub 链接用 `https://github.com/FlyingPigQAQ/`。微信图若保留，路径为 `/img/contact_wechat.png`。

- [ ] **Step 3: 验证**

```bash
npx hexo generate
test -f public/about/index.html
rg -n "clientSecret|Gitalk" public/about/index.html && exit 1 || true
```

Expected: 关于页存在；输出中没有 `clientSecret`。

- [ ] **Step 4: Commit**

```bash
git add source/about/index.md
git commit -m "$(cat <<'EOF'
feat: add Fluid about page from whoami

Keep the bio page and drop Gitalk credentials from the rebuild.
EOF
)"
```

---

### Task 6: GitHub Actions 部署到 master

**Files:**
- Create: `.github/workflows/deploy.yml`

**Interfaces:**
- Consumes: `npm ci`、`npx hexo generate`、`public/`、`source/CNAME`
- Produces: 向 `master` 强制发布 `public/`；Pages 自定义域名为 `blog.pigcanfly.top`

- [ ] **Step 1: 写入 `.github/workflows/deploy.yml`**

```yaml
name: Deploy Hexo to GitHub Pages

on:
  push:
    branches: [source]
  workflow_dispatch:

permissions:
  contents: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout source
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: npm

      - name: Install and generate
        run: |
          npm ci
          npx hexo generate

      - name: Publish public/ to master
        uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./public
          publish_branch: master
          force_orphan: true
          cname: blog.pigcanfly.top
```

`force_orphan: true` 会让 `master` 只剩最新生成树（含已提交到 master 的设计文档会被覆盖）。设计文档已拷在 `source` 的 `docs/`，这是预期。

- [ ] **Step 2: 本地再生成一次，确认 public 可独立作为站点**

```bash
npx hexo clean && npx hexo generate
test -f public/index.html
test "$(cat public/CNAME)" = "blog.pigcanfly.top"
test -f public/local-search.xml
```

Expected: 三个 `test` 都成功。

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "$(cat <<'EOF'
ci: deploy generated site from source to master

Rebuild on each source push so GitHub Pages keeps serving static files.
EOF
)"
```

---

### Task 7: 重写 AGENTS.md

**Files:**
- Create: `AGENTS.md`（在 `source` 分支）

**Interfaces:**
- Consumes: 本计划的分支约定与命令
- Produces: Agent 说明与现仓一致（源码在 source，不是「只有发布产物」）

- [ ] **Step 1: 写入 `AGENTS.md`**

```markdown
# AGENTS.md

用户对话用中文。用户指令优先于本文件。

## 这是什么

Hexo 8 + Fluid 的博客源码仓（站点名：想飞的猪猪）。
发布域名：`https://blog.pigcanfly.top`。

| 分支 | 内容 |
| --- | --- |
| `source` | 源码（本分支工作） |
| `master` | `hexo generate` 产物，仅 Actions 更新 |

不要在 `master` 上改 HTML。不要重新引入 Icarus。不要提交 `public/`、`node_modules/`、Gitalk 密钥。

## 常用命令

```bash
npm ci
npx hexo s          # http://localhost:4000
npx hexo generate
```

Node 22。主题配置在 `_config.fluid.yml`，站点配置在 `_config.yml`。

## 发布

推送 `source` 会触发 `.github/workflows/deploy.yml`，把 `public/` 推到 `master`。
首次上线前需要 DNS：`blog.pigcanfly.top` CNAME → `flyingpigqaq.github.io`，并在 GitHub Pages 填写该自定义域名。

## 内容

文章在 `source/_posts/`。关于页 `source/about/index.md`（`layout: about`）。
本轮没有评论。旧站 `www.pigcanflyqaq.com` 已弃用。
```

- [ ] **Step 2: Commit**

```bash
git add AGENTS.md
git commit -m "$(cat <<'EOF'
docs: rewrite AGENTS.md for Hexo source branch

Tell agents to edit source, not the generated master site.
EOF
)"
```

---

### Task 8: 推送 `source` 并核对 Actions（上线）

**Files:** 无新文件。需用户配置 DNS / Pages。

**Interfaces:**
- Consumes: `source` 上已提交的工作流
- Produces: `master` 变为 Fluid 静态站；`https://blog.pigcanfly.top` 在 DNS 生效后可访问

- [ ] **Step 1: 推送 source（必须用户明确同意 push）**

```bash
git push -u origin source
```

Expected: 远程出现 `source`。不要 `git push --force` 到 `master`；让 Action 写 `master`。

- [ ] **Step 2: 看 Actions 是否成功**

```bash
gh run list --branch source --workflow deploy.yml --limit 3
gh run watch
```

Expected: `build-and-deploy` 成功。失败则看 log：常见是 `npm ci` 缺 lockfile（回到 Task 1/2 补 `package-lock.json`）或 `hexo generate` 报错。

- [ ] **Step 3: 确认 master 已是新站**

```bash
git fetch origin master
git show origin/master:CNAME
git show origin/master:index.html | rg -n "fluid|Icarus|想飞的猪猪" | head
```

Expected: CNAME 为 `blog.pigcanfly.top`；`index.html` 含 Fluid / 站点名，不含 Icarus。

- [ ] **Step 4: 提醒用户做 DNS（Agent 做不了）**

用户操作：

1. `blog.pigcanfly.top` CNAME 到 `flyingpigqaq.github.io`
2. 仓库 Settings → Pages：Source 仍为 `master` `/`（根），Custom domain 填 `blog.pigcanfly.top`，开启 HTTPS

本地验收：`curl -sI https://blog.pigcanfly.top` 返回 200（DNS 传播后）。

---

## 自检对照 spec

| Spec 要求 | 任务 |
| --- | --- |
| Hexo 8 + Fluid，不要 Icarus | 1, 2 |
| 9 篇 Markdown，permalink 可变 | 4 |
| whoami → `/about/` | 5 |
| source → Actions → master | 1, 6, 8 |
| 域名 `blog.pigcanfly.top` | 3, 6, 8 |
| 更新 AGENTS.md | 7 |
| 无评论 / 无不蒜子 / 无 EdgeOne | 2, 5 |
| 弃用旧域名 | 3, 6 |
