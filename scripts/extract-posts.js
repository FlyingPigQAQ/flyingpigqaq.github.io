'use strict';

// Hexo auto-loads every file in scripts/; this extractor is CLI-only.
if (typeof hexo === 'undefined') {
  extractPosts();
}

function extractPosts() {
  const { execFileSync } = require('node:child_process');
  const { mkdirSync, writeFileSync } = require('node:fs');
  const { JSDOM } = require('jsdom');
  const TurndownService = require('turndown');

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

const LARGE_HTML_BYTES = 500 * 1024;
const turndown = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });
turndown.keep(['table']);

function rewriteHighlightFigures(contentEl) {
  contentEl.querySelectorAll('figure.highlight').forEach((fig) => {
    const lang = [...fig.classList].find((c) => c !== 'highlight' && c !== 'hljs') || '';
    const lines = fig.querySelectorAll('td.code .line');
    let text;
    if (lines.length) {
      text = [...lines].map((l) => l.textContent).join('\n');
    } else {
      const codeEl = fig.querySelector('td.code') || fig.querySelector('.code');
      if (codeEl) {
        codeEl.querySelectorAll('br').forEach((br) => br.replaceWith('\n'));
        text = codeEl.textContent.replace(/\n$/, '');
      } else {
        text = fig.textContent.replace(/\n$/, '');
      }
    }
    const pre = fig.ownerDocument.createElement('pre');
    const code = fig.ownerDocument.createElement('code');
    if (lang) code.className = `language-${lang}`;
    code.textContent = text;
    pre.appendChild(code);
    fig.replaceWith(pre);
  });
}

function show(path) {
  return execFileSync('git', ['show', `master:${path}`], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
}

function extractContentFragment(html) {
  const marker = '<div class="content">';
  const start = html.indexOf(marker);
  if (start < 0) return null;
  let i = start + marker.length;
  let depth = 1;
  while (i < html.length && depth > 0) {
    const nextOpen = html.indexOf('<div', i);
    const nextClose = html.indexOf('</div>', i);
    if (nextClose < 0) return null;
    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth += 1;
      i = nextOpen + 4;
    } else {
      depth -= 1;
      if (depth === 0) return html.slice(start, nextClose + 6);
      i = nextClose + 6;
    }
  }
  return null;
}

function parsePost(html) {
  if (html.length <= LARGE_HTML_BYTES) {
    const doc = new JSDOM(html).window.document;
    const contentEl = doc.querySelector('.content') || doc.querySelector('.article');
    return { doc, contentEl };
  }
  const contentHtml = extractContentFragment(html);
  if (!contentHtml) throw new Error('no content fragment');
  const metaHtml = `${html.slice(0, 80_000)}\n${html.slice(-30_000)}`;
  const doc = new JSDOM(metaHtml).window.document;
  const contentEl = new JSDOM(contentHtml).window.document.querySelector('.content');
  return { doc, contentEl };
}

mkdirSync('source/_posts', { recursive: true });

for (const post of posts) {
  const html = show(post.path);
  const { doc, contentEl } = parsePost(html);
  const title = doc.querySelector('h1.title, h1')?.textContent?.trim() || post.file.replace(/\.md$/, '');
  const time = doc.querySelector('time')?.getAttribute('datetime') || '';
  const categories = [...doc.querySelectorAll('.article-meta a[href*="/categories/"]')].map((a) => a.textContent.trim());
  const tags = [...doc.querySelectorAll('.article-tags a, a[href*="/tags/"]')]
    .map((a) => a.textContent.trim())
    .filter((t) => t && t !== '标签');
  if (!contentEl) throw new Error(`no content in ${post.path}`);
  contentEl.querySelectorAll('script, .gitalk, #comment-container, a.headerlink').forEach((n) => n.remove());
  rewriteHighlightFigures(contentEl);
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
}
