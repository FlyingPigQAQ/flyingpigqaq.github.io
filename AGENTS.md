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
