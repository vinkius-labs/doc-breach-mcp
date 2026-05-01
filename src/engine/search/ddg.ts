// ══════════════════════════════════════════════════════════════
// 💥 DocBreach MCP — DuckDuckGo Lite Engine
// 🦆 TACTICAL ROLE: THE SCOUT (Primary)
//
// The OG search engine. DDG Lite serves plain HTML tables —
// no JS, no CAPTCHA, no rate limits (usually). When it works
// it's the fastest, cleanest path to docs.
//
// Extracted from the original monolith into a pluggable engine
// that implements the SearchEngine interface for cascade use.
// ══════════════════════════════════════════════════════════════

import type { SearchEngine, SearchResult } from './types.js';
import { stripHtml } from '../shared/utils.js';

// ── Configuration ────────────────────────────────────────────

const DDG_LITE_URL = 'https://lite.duckduckgo.com/lite/';
const DDG_TIMEOUT  = 10_000;
const DDG_UA       = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

// ── Patterns ─────────────────────────────────────────────────

const LINK_RE    = /<a[^>]*class=['"]\s*result-link\s*['"][^>]*href=['"]([^'"]+)['"][^>]*>([\s\S]*?)<\/a>|<a[^>]*href=['"]([^'"]+)['"][^>]*class=['"]\s*result-link\s*['"][^>]*>([\s\S]*?)<\/a>/gi;
const SNIPPET_RE = /<td[^>]*class=['"]\s*result-snippet\s*['"][^>]*>([\s\S]*?)<\/td>/gi;

// ── Engine Implementation ────────────────────────────────────

export const ddgEngine: SearchEngine = {
    name: 'DuckDuckGo Lite',

    async search(query: string, maxResults: number): Promise<readonly SearchResult[]> {
        try {
            const html = await fetchLite(query);
            return parseResults(html).slice(0, maxResults);
        } catch {
            return [];
        }
    },
};

// ── Transport ────────────────────────────────────────────────

async function fetchLite(query: string): Promise<string> {
    const response = await fetch(DDG_LITE_URL, {
        method:  'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent':   DDG_UA,
        },
        body:   new URLSearchParams({ q: query, kl: '' }).toString(),
        signal: AbortSignal.timeout(DDG_TIMEOUT),
    });

    if (!response.ok) throw new Error(`DDG ${response.status}`);
    return response.text();
}

// ── Parser ───────────────────────────────────────────────────

function parseResults(html: string): SearchResult[] {
    const links    = matchAll(html, LINK_RE, parseLinkMatch);
    const snippets = matchAll(html, SNIPPET_RE, m => stripHtml(m[1]).trim());

    return dedup(links.map((link, i) => ({
        url:     link.url,
        title:   link.title,
        snippet: snippets[i] ?? '',
    })));
}

interface RawLink { readonly url: string; readonly title: string; }

function parseLinkMatch(m: RegExpMatchArray): RawLink {
    const url   = m[1] ?? m[3];
    const title = m[2] ?? m[4];
    return { url: decodeRedirect(url), title: stripHtml(title).trim() };
}

function matchAll<T>(html: string, pattern: RegExp, transform: (m: RegExpMatchArray) => T): T[] {
    return [...html.matchAll(new RegExp(pattern.source, pattern.flags))].map(transform);
}

function dedup(results: SearchResult[]): SearchResult[] {
    const seen = new Set<string>();
    return results.filter(r => {
        if (!r.url || seen.has(r.url)) return false;
        seen.add(r.url);
        return true;
    });
}

function decodeRedirect(ddgUrl: string): string {
    const match = ddgUrl.match(/[?&]uddg=([^&]+)/);
    if (match) return decodeURIComponent(match[1]);
    if (ddgUrl.startsWith('http')) return ddgUrl;
    if (ddgUrl.startsWith('//'))   return `https:${ddgUrl}`;
    return ddgUrl;
}
