// ══════════════════════════════════════════════════════════════
// 💥 DocBreach MCP — Page Title Extraction
// ══════════════════════════════════════════════════════════════

import * as cheerio from 'cheerio';

// ── Extractor Pipeline ───────────────────────────────────────

type TitleExtractor = ($: cheerio.CheerioAPI) => string | undefined;

const EXTRACTORS: readonly TitleExtractor[] = [
    $ => $('h1').first().text().trim() || undefined,
    $ => $('meta[property="og:title"]').attr('content')?.trim() || undefined,
    $ => $('title').text().trim() || undefined,
];

// ── Public API ───────────────────────────────────────────────

/**
 * Extract the page title from HTML.
 *
 * Priority: `<h1>` → `og:title` → `<title>`.
 */
export function extractTitle(html: string): string {
    const $ = cheerio.load(html);

    for (const extract of EXTRACTORS) {
        const title = extract($);
        if (title) return title;
    }

    return '';
}
