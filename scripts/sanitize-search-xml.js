'use strict';

// XML 1.0 Char: #x9 | #xA | #xD | [#x20-#xD7FF] | [#xE000-#xFFFD] | [#x10000-#x10FFFF]
const ILLEGAL_XML_1_0 = /[^\t\n\r\u0020-\uD7FF\uE000-\uFFFD\u{10000}-\u{10FFFF}]/gu;

function stripIllegalXml10Chars(text) {
  return text.replace(ILLEGAL_XML_1_0, '');
}

function collectSearchXmlRoutePaths(routeList) {
  return routeList.filter((p) => {
    const normalized = String(p).replace(/^\/+/, '');
    return normalized === 'local-search.xml' || normalized === 'search.xml';
  });
}

function readRouteText(route, path) {
  return new Promise((resolve, reject) => {
    const stream = route.get(path);
    if (!stream) {
      resolve(null);
      return;
    }
    const chunks = [];
    stream.on('data', (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
    });
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    stream.on('error', reject);
  });
}

async function sanitizeSearchXmlRoutes(route) {
  const paths = collectSearchXmlRoutePaths(route.list());
  for (const p of paths) {
    const text = await readRouteText(route, p);
    if (text == null) continue;
    const sanitized = stripIllegalXml10Chars(text);
    if (sanitized !== text) {
      route.set(p, sanitized);
    }
  }
}

module.exports = {
  stripIllegalXml10Chars,
  collectSearchXmlRoutePaths,
  sanitizeSearchXmlRoutes
};

if (typeof hexo !== 'undefined') {
  hexo.extend.filter.register('after_generate', function sanitizeSearchXmlAfterGenerate() {
    return sanitizeSearchXmlRoutes(hexo.route);
  });
}
