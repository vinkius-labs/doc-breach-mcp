// ══════════════════════════════════════════════════════════════
// 💥 DocBreach MCP — Brave Search Engine
// 🦁 TACTICAL ROLE: THE LION (Fallback #1)
//
// When DDG Lite fails (empty results or rate-limited), Brave
// Search is the cavalry. It serves full server-rendered HTML
// with clear external links — no JS hydration needed.
//
// 🛡️ WHY NOT SearXNG? We tested every public instance on
// searx.space — 100% returned HTTP 429 (rate limit) or had
// JSON format disabled. Public SearXNG is dead for programmatic
// use. Brave's HTML is rock-solid and returns results for
// queries that DDG misses (like "booking.com API docs").
//
// Zero API keys. Zero Docker. Just HTTP + regex.
// ══════════════════════════════════════════════════════════════

import type { SearchEngine, SearchResult } from './types.js';
import { stripHtml } from '../shared/utils.js';

// ── Configuration ────────────────────────────────────────────

const BRAVE_URL     = 'https://search.brave.com/search';
const BRAVE_TIMEOUT = 10_000;

/**
 * 🛡️ Desktop Chrome UA — Brave serves the most parseable HTML
 * to desktop browsers. Mobile variants have more obfuscation.
 */
const BRAVE_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

// ── Engine Implementation ────────────────────────────────────

export const braveEngine: SearchEngine = {
    name: 'Brave Search',

    async search(query: string, maxResults: number): Promise<readonly SearchResult[]> {
        try {
            const html = await fetchBrave(query);
            return parseBraveResults(html).slice(0, maxResults);
        } catch {
            return [];
        }
    },
};

// ── Transport ────────────────────────────────────────────────

async function fetchBrave(query: string): Promise<string> {
    const params = new URLSearchParams({ q: query });

    const response = await fetch(`${BRAVE_URL}?${params}`, {
        headers: {
            'User-Agent':      BRAVE_UA,
            'Accept':          'text/html,application/xhtml+xml',
            'Accept-Language': 'en-US,en;q=0.9',
        },
        signal: AbortSignal.timeout(BRAVE_TIMEOUT),
        redirect: 'follow',
    });

    if (!response.ok) throw new Error(`Brave ${response.status}`);
    return response.text();
}

// ── Parser ───────────────────────────────────────────────────
//
// ⚛️ Brave uses SvelteKit SSR. The HTML contains result snippets
// as <div data-type="web"> blocks with <a href="..."> links.
// We extract using two strategies:
//   1. Primary: Structured snippet blocks with data-type="web"
//   2. Fallback: All external href links (deduplicated)

/**
 * 🛡️ Primary extraction pattern.
 *
 * Brave renders each organic result as:
 *   <div class="snippet" data-type="web">
 *     <a href="https://actual-url.com" class="...">
 *       <div class="site-name-content">Site Name</div>
 *     </a>
 *     <div class="snippet-title"><a href="...">Title Text</a></div>
 *     <div class="snippet-description">Description...</div>
 *   </div>
 */
const SNIPPET_BLOCK_RE = /<div[^>]*data-type="web"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/gi;
const TITLE_LINK_RE    = /class="snippet-title[^"]*"[^>]*>\s*<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i;
const DESCRIPTION_RE   = /class="snippet-description[^"]*"[^>]*>([\s\S]*?)<\/div>/i;

function parseBraveResults(html: string): SearchResult[] {
    // Strategy 1: Parse structured snippet blocks
    const structured = parseStructuredResults(html);
    if (structured.length >= 3) return structured;

    // Strategy 2: Fallback to extracting all external links
    return parseFallbackLinks(html);
}

function parseStructuredResults(html: string): SearchResult[] {
    const results: SearchResult[] = [];

    for (const block of html.matchAll(new RegExp(SNIPPET_BLOCK_RE.source, SNIPPET_BLOCK_RE.flags))) {
        const content = block[1];
        if (!content) continue;

        const titleMatch = content.match(TITLE_LINK_RE);
        if (!titleMatch) continue;

        const url   = titleMatch[1];
        const title = stripHtml(titleMatch[2]).trim();

        if (!url || !title || !isOrganic(url)) continue;

        const descMatch = content.match(DESCRIPTION_RE);
        const snippet   = descMatch ? stripHtml(descMatch[1]).trim() : '';

        results.push({ url, title, snippet });
    }

    return dedup(results);
}

/**
 * 🪟 FALLBACK STRATEGY — Extract from raw href attributes.
 *
 * When Brave changes their CSS class names (they will), the
 * structured parser breaks. This fallback extracts ALL external
 * links and filters out noise (brave.com, youtube, google, etc).
 *
 * Less precise (no titles/snippets), but 100% resilient to
 * HTML structure changes. The URL itself is the intelligence.
 */
function parseFallbackLinks(html: string): SearchResult[] {
    const linkRe = /href="(https?:\/\/[^"]+)"/gi;
    const seen   = new Set<string>();
    const results: SearchResult[] = [];

    for (const match of html.matchAll(linkRe)) {
        const url = match[1];
        if (!url || !isOrganic(url) || seen.has(url)) continue;
        seen.add(url);

        // Try to extract nearby text as a title hint
        const title = extractDomainTitle(url);

        results.push({ url, title, snippet: '' });
    }

    return results;
}

// ── Utilities ────────────────────────────────────────────────

const NOISE_DOMAINS = [
    'brave.com', 'brave.software', 'jsdelivr', 'gstatic',
    'google.com', 'googleapis.com', 'youtube.com', 'youtu.be',
    'facebook.com', 'twitter.com', 'x.com',
    'imgs.search.brave', 'favicons.search.brave',
] as const;

function isOrganic(url: string): boolean {
    if (!url.startsWith('http')) return false;
    return !NOISE_DOMAINS.some(d => url.includes(d));
}

function extractDomainTitle(url: string): string {
    try {
        const { hostname, pathname } = new URL(url);
        const domain = hostname.replace('www.', '');
        const path   = pathname.replace(/\/$/, '').split('/').pop() ?? '';
        const label  = path
            .replace(/[-_]/g, ' ')
            .replace(/\.\w+$/, '')
            .trim();
        return label ? `${domain} — ${label}` : domain;
    } catch {
        return url;
    }
}

function dedup(results: SearchResult[]): SearchResult[] {
    const seen = new Set<string>();
    return results.filter(r => {
        if (seen.has(r.url)) return false;
        seen.add(r.url);
        return true;
    });
}
