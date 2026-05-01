// ══════════════════════════════════════════════════════════════
// 💥 DocBreach MCP — Search (Public API)
//
// Composes transport + parser into a single search function.
// ══════════════════════════════════════════════════════════════

export type { SearchResult } from './types.js';

import type { SearchResult } from './types.js';
import { fetchLite } from './transport.js';
import { parseResults } from './parser.js';

/**
 * Search DuckDuckGo Lite for documentation pages.
 *
 * Returns up to `maxResults` deduplicated results.
 * Fails gracefully to an empty array.
 */
export async function searchDDG(query: string, maxResults = 10): Promise<readonly SearchResult[]> {
    try {
        const html = await fetchLite(query);
        return parseResults(html).slice(0, maxResults);
    } catch {
        return [];
    }
}
