// ══════════════════════════════════════════════════════════════
// 🗺️ TACTICAL BYPASS: INTEL EXTRACTION
//
// Instead of making the agent click through 20 sidebar links,
// we extract every nav link in one pass and resolve them to
// absolute URLs. One tool call replaces 20 minutes of crawling.
// ══════════════════════════════════════════════════════════════

import * as cheerio from 'cheerio';
import { resolveUrl } from '../shared/utils.js';

// ── Types ────────────────────────────────────────────────────

export interface NavLink {
    readonly title: string;
    readonly url: string;
}

// ── Selector Registry ────────────────────────────────────────

const NAV_SELECTORS: readonly string[] = [
    '.docs-sidebar a', '.sidebar-nav a',
    '.table-of-contents a', '.toc a',
    'nav a', 'aside a', '[role="navigation"] a',
    '.menu a', '.api-navigation a', '.doc-nav a',
];

// ── Noise Filters ────────────────────────────────────────────

const NOISE_PATTERNS: readonly RegExp[] = [
    /^#/,                          /^javascript:/i,
    /^mailto:/i,                   /\.(png|jpg|svg|gif|ico)$/i,
    /\/(login|signin|signup)\b/i,
];

const isRelevant = (href: string): boolean =>
    href.length > 1 && !NOISE_PATTERNS.some(p => p.test(href));

// ── Public API ───────────────────────────────────────────────

/**
 * Extract navigation links from an HTML document.
 *
 * Resolves relative URLs and deduplicates.
 */
export function extractNavLinks(html: string, baseUrl: string): readonly NavLink[] {
    const $ = cheerio.load(html);
    const seen  = new Set<string>();
    const links: NavLink[] = [];

    for (const selector of NAV_SELECTORS) {
        $(selector).each((_, el) => {
            const href  = $(el).attr('href');
            const title = $(el).text().trim();

            if (!href || !title || title.length < 2) return;
            if (!isRelevant(href)) return;

            const absolute = resolveUrl(href, baseUrl);
            if (!absolute || seen.has(absolute)) return;

            seen.add(absolute);
            links.push({ title, url: absolute });
        });
    }

    return links;
}
