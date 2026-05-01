// ══════════════════════════════════════════════════════════════
// 💥 DocBreach MCP — Sitemap XML Parser
// 🗺️ TACTICAL ROLE: THE CARTOGRAPHER
//
// sitemap.xml is the web's native site map. Every serious docs
// site has one. We parse it to extract ALL documentation URLs
// in a single GET — no crawling, no guessing, no wasted calls.
//
// 🛡️ We also handle sitemap indexes (sitemaps of sitemaps),
// which large docs sites use to split thousands of URLs into
// manageable chunks. We follow ONE level deep to avoid storms.
// ══════════════════════════════════════════════════════════════

import type { SiteMapEntry } from './types.js';
import { fetchUrl } from '../fetch/index.js';

// ── XML Patterns ─────────────────────────────────────────────
//
// We use regex instead of a full XML parser because:
//   1. Zero additional dependencies
//   2. sitemap.xml is trivially structured
//   3. Cheerio is overkill for <url><loc>...</loc></url>

const LOC_RE      = /<loc>\s*(.*?)\s*<\/loc>/gi;
const LASTMOD_RE  = /<lastmod>\s*(.*?)\s*<\/lastmod>/gi;
const PRIORITY_RE = /<priority>\s*(.*?)\s*<\/priority>/gi;
const URL_BLOCK_RE = /<url>([\s\S]*?)<\/url>/gi;
const SITEMAP_BLOCK_RE = /<sitemap>([\s\S]*?)<\/sitemap>/gi;

// ── Max Limits ───────────────────────────────────────────────
//
// 🛡️ Sanity limits to prevent memory explosions on mega-sitemaps.
// Stripe has 50,000+ URLs in their sitemap. We cap at 500 entries
// for the map view — agents don't need ALL of them, just the structure.

const MAX_ENTRIES       = 500;
const MAX_INDEX_FOLLOWS = 3;

// ── Public API ───────────────────────────────────────────────

/**
 * Fetch and parse a sitemap.xml, returning structured entries.
 *
 * Handles both standard sitemaps and sitemap indexes.
 * Filters to only include documentation-looking URLs.
 */
export async function parseSitemapXml(domain: string): Promise<readonly SiteMapEntry[]> {
    const sitemapUrls = [
        `https://${domain}/sitemap.xml`,
        `https://docs.${domain}/sitemap.xml`,
        `https://developer.${domain}/sitemap.xml`,
        `https://developers.${domain}/sitemap.xml`,
    ];

    for (const url of sitemapUrls) {
        try {
            const result = await fetchUrl(url, 10_000);
            if (result.status >= 400) continue;
            if (!result.body.includes('<urlset') && !result.body.includes('<sitemapindex')) continue;

            // Sitemap index → follow child sitemaps
            if (result.body.includes('<sitemapindex')) {
                return parseSitemapIndex(result.body);
            }

            return parseUrlset(result.body);
        } catch {
            continue;
        }
    }

    return [];
}

// ── Parsers ──────────────────────────────────────────────────

function parseUrlset(xml: string): SiteMapEntry[] {
    const entries: SiteMapEntry[] = [];

    for (const block of xml.matchAll(URL_BLOCK_RE)) {
        if (entries.length >= MAX_ENTRIES) break;

        const content  = block[1];
        const loc      = content.match(/<loc>\s*(.*?)\s*<\/loc>/i)?.[1];
        const lastmod  = content.match(/<lastmod>\s*(.*?)\s*<\/lastmod>/i)?.[1];
        const priority = content.match(/<priority>\s*(.*?)\s*<\/priority>/i)?.[1];

        if (!loc || !loc.startsWith('http')) continue;
        if (!isDocUrl(loc)) continue;

        entries.push({
            url:         decodeXmlEntities(loc),
            title:       titleFromUrl(loc),
            description: '',
            section:     sectionFromUrl(loc),
            source:      'sitemap_xml',
            lastmod:     lastmod ?? undefined,
            priority:    priority ? parseFloat(priority) : undefined,
        });
    }

    return entries;
}

async function parseSitemapIndex(xml: string): Promise<SiteMapEntry[]> {
    const childUrls: string[] = [];

    for (const block of xml.matchAll(SITEMAP_BLOCK_RE)) {
        const loc = block[1].match(/<loc>\s*(.*?)\s*<\/loc>/i)?.[1];
        if (loc && isDocSitemap(loc)) {
            childUrls.push(decodeXmlEntities(loc));
        }
    }

    // Follow a limited number of child sitemaps
    const entries: SiteMapEntry[] = [];
    const toFollow = childUrls.slice(0, MAX_INDEX_FOLLOWS);

    for (const url of toFollow) {
        try {
            const result = await fetchUrl(url, 10_000);
            if (result.status < 400 && result.body.includes('<urlset')) {
                entries.push(...parseUrlset(result.body));
            }
        } catch {
            continue;
        }
        if (entries.length >= MAX_ENTRIES) break;
    }

    return entries.slice(0, MAX_ENTRIES);
}

// ── Filters & Helpers ────────────────────────────────────────

/**
 * 🛡️ Filter: only keep URLs that look like documentation.
 * Skip blog posts, marketing pages, careers, etc.
 */
const DOC_INDICATORS = [
    '/docs', '/doc/', '/api', '/reference', '/guide',
    '/tutorial', '/getting-started', '/quickstart',
    '/sdk', '/library', '/client', '/webhook',
    '/authentication', '/auth', '/overview',
] as const;

const NOISE_INDICATORS = [
    '/blog', '/careers', '/jobs', '/press',
    '/about', '/contact', '/pricing', '/legal',
    '/privacy', '/terms', '/status', '/changelog',
    '/community', '/forum', '/support/ticket',
] as const;

function isDocUrl(url: string): boolean {
    const path = new URL(url).pathname.toLowerCase();
    if (NOISE_INDICATORS.some(n => path.includes(n))) return false;
    // If the URL is from a docs subdomain, include everything
    if (url.includes('docs.') || url.includes('developer')) return true;
    // Otherwise only include if it has a doc-like path
    if (path === '/' || path === '') return true;
    return DOC_INDICATORS.some(d => path.includes(d)) || path.split('/').length <= 3;
}

function isDocSitemap(url: string): boolean {
    const lower = url.toLowerCase();
    return lower.includes('doc') || lower.includes('api') || lower.includes('dev')
        || !lower.includes('blog');
}

function titleFromUrl(url: string): string {
    try {
        const { pathname } = new URL(url);
        const segments = pathname.replace(/\/$/, '').split('/').filter(Boolean);
        const last = segments[segments.length - 1] ?? '';
        return last
            .replace(/[-_]/g, ' ')
            .replace(/\.\w+$/, '')
            .replace(/\b\w/g, c => c.toUpperCase())
            .trim() || 'Home';
    } catch {
        return url;
    }
}

function sectionFromUrl(url: string): string {
    try {
        const { pathname } = new URL(url);
        const segments = pathname.replace(/\/$/, '').split('/').filter(Boolean);
        return segments.length > 1
            ? segments[0].replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
            : 'Root';
    } catch {
        return 'Root';
    }
}

function decodeXmlEntities(s: string): string {
    return s
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'");
}
