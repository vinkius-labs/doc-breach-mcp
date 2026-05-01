// ══════════════════════════════════════════════════════════════
// 💥 DocBreach MCP — DDG Lite Result Parser
//
// DDG Lite returns plain HTML tables with result-link and
// result-snippet classes. We extract with matchAll, decode
// redirect URLs, and zip into SearchResult[].
// ══════════════════════════════════════════════════════════════

import type { SearchResult } from './types.js';
import { stripHtml } from '../shared/utils.js';

// ── Patterns ─────────────────────────────────────────────────

const LINK_RE    = /<a[^>]*class="result-link"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
const SNIPPET_RE = /<td[^>]*class="result-snippet"[^>]*>([\s\S]*?)<\/td>/gi;

// ── Public API ───────────────────────────────────────────────

/**
 * Parse DDG Lite HTML into deduplicated SearchResult[].
 */
export function parseResults(html: string): SearchResult[] {
    const links    = matchAll(html, LINK_RE, parseLinkMatch);
    const snippets = matchAll(html, SNIPPET_RE, m => stripHtml(m[1]).trim());

    return dedup(links.map((link, i) => ({
        url:     link.url,
        title:   link.title,
        snippet: snippets[i] ?? '',
    })));
}

// ── Extraction ───────────────────────────────────────────────

interface RawLink { readonly url: string; readonly title: string; }

function parseLinkMatch(m: RegExpMatchArray): RawLink {
    return { url: decodeRedirect(m[1]), title: stripHtml(m[2]).trim() };
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

// ── URL Decoding ─────────────────────────────────────────────

function decodeRedirect(ddgUrl: string): string {
    const match = ddgUrl.match(/[?&]uddg=([^&]+)/);
    if (match) return decodeURIComponent(match[1]);
    if (ddgUrl.startsWith('http')) return ddgUrl;
    if (ddgUrl.startsWith('//'))   return `https:${ddgUrl}`;
    return ddgUrl;
}
