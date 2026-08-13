'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { Readable } = require('node:stream');
const {
  stripIllegalXml10Chars,
  collectSearchXmlRoutePaths,
  sanitizeSearchXmlRoutes
} = require('../scripts/sanitize-search-xml');

describe('stripIllegalXml10Chars', () => {
  it('strips U+FFFE and U+FFFF', () => {
    const input = `ok\uFFFE mid \uFFFF end`;
    assert.equal(stripIllegalXml10Chars(input), 'ok mid  end');
  });

  it('strips C0 controls except tab, LF, and CR', () => {
    const input = 'A\u0000B\u0008C\u000BD\u000CE\u001FF';
    assert.equal(stripIllegalXml10Chars(input), 'ABCDEF');
  });

  it('keeps tab, LF, CR, Chinese, and supplementary-plane chars', () => {
    const input = 'Unicode编码表\t\n\rGoGoGo 😀';
    assert.equal(stripIllegalXml10Chars(input), input);
  });

  it('keeps a searchable Unicode title inside otherwise illegal XML content', () => {
    const xml = [
      '<?xml version="1.0"?><search><entry>',
      '<title>Unicode编码表</title>',
      `<content>before\uFFFE\u0001\uFFFFafter</content>`,
      '</entry></search>'
    ].join('');
    const out = stripIllegalXml10Chars(xml);
    assert.match(out, /<title>Unicode编码表<\/title>/);
    assert.equal(out.includes('\uFFFE'), false);
    assert.equal(out.includes('\uFFFF'), false);
  });
});

describe('collectSearchXmlRoutePaths', () => {
  it('selects local-search.xml and search.xml regardless of leading slash', () => {
    const paths = collectSearchXmlRoutePaths([
      'index.html',
      'xml/local-search.xml',
      '/local-search.xml',
      'search.xml',
      '2019/03/26/Unicode编码表/index.html'
    ]);
    assert.deepEqual(paths.sort(), ['/local-search.xml', 'search.xml']);
  });
});

describe('sanitizeSearchXmlRoutes', () => {
  it('rewrites only search XML routes', async () => {
    const store = {
      'local-search.xml': 'title\uFFFEUnicode编码表\uFFFF',
      'search.xml': 'SSH安装操作系统\u0001',
      'index.html': 'keep\uFFFE'
    };
    const route = {
      list: () => Object.keys(store),
      get: (p) => Readable.from([store[p]]),
      set: (p, data) => {
        store[p] = data;
      }
    };

    await sanitizeSearchXmlRoutes(route);

    assert.equal(store['local-search.xml'], 'titleUnicode编码表');
    assert.equal(store['search.xml'], 'SSH安装操作系统');
    assert.equal(store['index.html'], 'keep\uFFFE');
  });
});
