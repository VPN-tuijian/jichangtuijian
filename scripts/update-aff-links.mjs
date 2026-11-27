// Run `node scripts/update-aff-links.mjs` after editing README links.
// Run with `--check` to verify without writing. GitHub renders static Markdown,
// so tracking parameters must be generated before publishing the README.
import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const SOURCE_PAGE = 'https://github.com/VPN-tuijian/jichangtuijian';
const PLACEMENTS = new Set(['top_banner', 'article_inline', 'sidebar', 'footer']);

export function withAffTracking(shortUrl, sourcePage, placement) {
  if (new URL(shortUrl).hostname !== 'aff.kitdude.com') {
    throw new Error('Expected an aff.kitdude.com short link');
  }
  if (!PLACEMENTS.has(placement)) {
    throw new Error(`Unknown AFF placement: ${placement}`);
  }

  const source = new URL(sourcePage);
  const hashIndex = shortUrl.indexOf('#');
  const hash = hashIndex < 0 ? '' : shortUrl.slice(hashIndex);
  const withoutHash = hashIndex < 0 ? shortUrl : shortUrl.slice(0, hashIndex);
  const queryIndex = withoutHash.indexOf('?');
  const base = queryIndex < 0 ? withoutHash : withoutHash.slice(0, queryIndex);
  const params = new URLSearchParams(queryIndex < 0 ? '' : withoutHash.slice(queryIndex + 1));
  params.set('utm_source', source.hostname.toLowerCase() + source.pathname);
  params.set('utm_content', placement);
  return `${base}?${params.toString()}${hash}`;
}

export function updateReadme(markdown) {
  // All current placements are in article tables or body text.
  return markdown.replace(
    /(\]\()(https:\/\/aff\.kitdude\.com\/[^\s)]+)(\))/g,
    (_, open, href, close) => `${open}${withAffTracking(href, SOURCE_PAGE, 'article_inline')}${close}`,
  );
}

if (typeof process !== 'undefined' && process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const file = new URL('../README.md', import.meta.url);
  const original = await readFile(file, 'utf8');
  const updated = updateReadme(original);
  if (process.argv.includes('--check')) {
    if (updated !== original) {
      console.error('README AFF links need updating. Run node scripts/update-aff-links.mjs');
      process.exitCode = 1;
    }
  } else if (updated !== original) {
    await writeFile(file, updated);
  }
}
