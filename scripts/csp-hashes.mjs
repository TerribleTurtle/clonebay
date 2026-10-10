// Post-build step: build a hash-based Content-Security-Policy for the static export.
//
// `output: 'export'` has no server, so per-request nonces are impossible. Next's static HTML
// contains inline bootstrap scripts (self.__next_f.push(...)) whose content is fixed at build
// time, so we hash each one (SHA-256) and allow exactly those hashes per page.
//
// Output: CSP rules appended to out/_headers (Cloudflare Pages). Each HTML route gets its own
// rule because the inline scripts differ per page and one combined list would exceed the
// 2,000-character line limit. The existing `/*` rule gets the 404 page's hashes (Pages serves
// 404.html for unknown paths); route rules detach it with `! Content-Security-Policy` first.
//
// Fails loudly (non-zero exit) on anything unexpected.

import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const OUT_DIR = path.join(process.cwd(), 'out');
const HEADERS_FILE = path.join(OUT_DIR, '_headers');

// Cloudflare Pages limits (https://developers.cloudflare.com/pages/configuration/headers/)
const MAX_LINE_CHARS = 2000;
const MAX_RULES = 100;
const ERROR_SNIPPET_CHARS = 80;

// Script types the browser executes. Anything else (e.g. application/ld+json) is a data block
// that CSP script-src doesn't govern, so it needs no hash.
const EXECUTABLE_TYPES = new Set(['', 'text/javascript', 'application/javascript', 'module']);

/** @param {string[]} scriptHashes */
function buildPolicy(scriptHashes) {
  const scriptSrc = ["'self'", ...scriptHashes.map((h) => `'${h}'`)].join(' ');
  return [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    // Kept: Next/React emit inline style attributes and next/font inline <style>.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' https://images.evetech.net data: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://esi.evetech.net https://login.eveonline.com",
    "worker-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "form-action 'self'",
  ].join('; ');
}

/** @param {string} dir @returns {string[]} */
function findHtmlFiles(dir) {
  /** @type {string[]} */
  const found = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) found.push(...findHtmlFiles(full));
    else if (entry.name.endsWith('.html')) found.push(full);
  }
  return found;
}

/** @param {string} attrs */
function scriptType(attrs) {
  const m = /\stype\s*=\s*["']?([^"'\s>]+)/i.exec(attrs);
  return m ? m[1].toLowerCase() : '';
}

/** @param {string} file @returns {string[]} unique sha256 hashes of executable inline scripts */
function hashInlineScripts(file) {
  const html = readFileSync(file, 'utf8');
  const rel = path.relative(OUT_DIR, file);

  // Hashes can't allow inline event handlers or javascript: URLs; refuse to ship them.
  const handler = /<[a-z][^>]*\son[a-z]+\s*=/i.exec(html);
  if (handler) throw new Error(`${rel}: inline event handler found near "${handler[0].slice(0, ERROR_SNIPPET_CHARS)}"`);
  if (/\b(href|src|action)\s*=\s*["']?\s*javascript:/i.test(html)) {
    throw new Error(`${rel}: javascript: URL found`);
  }

  const hashes = new Set();
  let skippedData = 0;
  for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const [, attrs, body] = m;
    if (/\ssrc\s*=/i.test(attrs)) continue;
    if (!EXECUTABLE_TYPES.has(scriptType(attrs))) {
      skippedData += 1;
      continue;
    }
    const digest = createHash('sha256').update(body, 'utf8').digest('base64');
    hashes.add(`sha256-${digest}`);
  }
  console.log(`[csp] ${rel}: ${hashes.size} inline script hash(es), ${skippedData} data block(s) skipped`);
  return [...hashes].sort();
}

/** out/index.html -> "/", out/a/b/index.html -> "/a/b/", out/404.html -> null (fallback) */
function routeFor(file) {
  const rel = path.relative(OUT_DIR, file).split(path.sep).join('/');
  if (rel === '404.html') return null;
  if (rel === 'index.html') return '/';
  if (rel.endsWith('/index.html')) return `/${rel.slice(0, -'index.html'.length)}`;
  throw new Error(`Unexpected HTML file layout: ${rel} (trailingSlash export expected)`);
}

function main() {
  if (!existsSync(OUT_DIR)) throw new Error('out/ not found. Run `next build` first.');
  if (!existsSync(HEADERS_FILE)) throw new Error('out/_headers not found (expected copy of public/_headers).');

  const existing = readFileSync(HEADERS_FILE, 'utf8');
  if (/content-security-policy/i.test(existing.replace(/^#.*$/gm, ''))) {
    throw new Error('out/_headers already contains a CSP rule. Rebuild from a clean out/.');
  }

  const htmlFiles = findHtmlFiles(OUT_DIR);
  if (htmlFiles.length === 0) throw new Error('No HTML files in out/.');

  const fallback = htmlFiles.find((f) => routeFor(f) === null);
  if (!fallback) throw new Error('out/404.html not found; cannot build the /* fallback CSP.');

  // A second `/*` rule replaces the first instead of merging with it, so the fallback CSP is
  // inserted into the existing `/*` block from public/_headers.
  const baseLines = existing.replace(/\r\n/g, '\n').replace(/\n+$/, '').split('\n');
  const starIdx = baseLines.findIndex((l) => l.trim() === '/*');
  if (starIdx === -1) throw new Error('public/_headers must contain a `/*` rule.');
  let insertAt = starIdx + 1;
  while (insertAt < baseLines.length && /^\s+\S/.test(baseLines[insertAt])) insertAt += 1;
  baseLines.splice(
    insertAt,
    0,
    `  Content-Security-Policy: ${buildPolicy(hashInlineScripts(fallback))}`,
  );

  const lines = ['', '# --- Per-route CSP generated by scripts/csp-hashes.mjs. Do not edit. ---'];

  let routeCount = 0;
  for (const file of htmlFiles.sort()) {
    const route = routeFor(file);
    if (route === null) continue;
    lines.push(route, '  ! Content-Security-Policy');
    lines.push(`  Content-Security-Policy: ${buildPolicy(hashInlineScripts(file))}`);
    routeCount += 1;
  }

  const allLines = [...baseLines, ...lines];
  const tooLong = allLines.find((l) => l.length > MAX_LINE_CHARS);
  if (tooLong) throw new Error(`Generated _headers line is ${tooLong.length} chars (limit ${MAX_LINE_CHARS}).`);

  const totalRules = allLines.filter((l) => /^[^\s#]/.test(l)).length;
  if (totalRules > MAX_RULES) throw new Error(`_headers would have ${totalRules} rules (limit ${MAX_RULES}).`);

  writeFileSync(HEADERS_FILE, `${allLines.join('\n')}\n`, 'utf8');
  console.log(`[csp] Wrote CSP for ${routeCount} route(s) + /* fallback to out/_headers (${totalRules} rules). Skipped: 0.`);
}

main();
