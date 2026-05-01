// ══════════════════════════════════════════════════════════════
// 💥 DocBreach MCP — Search Cascade (Orchestrator)
// 🎯 TACTICAL ROLE: THE GENERAL
//
// Two-engine cascade — battle-tested, zero bullshit:
//
//   DDG Lite → Brave Search
//
// If DDG returns results, we stop. If DDG fails or returns
// nothing, Brave gets a shot. Both are free, zero-key,
// zero-Docker, zero-config.
//
// 🛡️ WHY ONLY TWO?
// - SearXNG public instances: 100% HTTP 429 rate-limited
// - Google Lite (gbv=1): JS redirect on 2/3 queries
// - Brave Search HTML: 3/3 queries returned valid results ✅
//
// We tested. We measured. We kept what works.
// ══════════════════════════════════════════════════════════════

export type { SearchResult, SearchEngine } from './types.js';

import type { SearchResult, SearchEngine } from './types.js';
import { ddgEngine } from './ddg.js';
import { braveEngine } from './brave.js';

// ── Engine Cascade Order ─────────────────────────────────────
//
// 🛡️ Priority logic:
//   1. DDG Lite — Fastest, most reliable for doc queries
//   2. Brave Search — Server-rendered HTML, catches what DDG misses
//
// Each engine fails gracefully (returns []).
// The cascade stops at the FIRST engine that returns results.

const CASCADE: readonly SearchEngine[] = [
    ddgEngine,
    braveEngine,
];

// ── Public API ───────────────────────────────────────────────

/**
 * Search for documentation using a multi-engine cascade.
 *
 * Tries engines in order: DDG Lite → Brave Search.
 * Returns results from the FIRST engine that succeeds.
 * Returns empty array only if ALL engines fail.
 *
 * Zero API keys. Zero Docker. Zero single points of failure.
 */
export async function searchDDG(query: string, maxResults = 10): Promise<readonly SearchResult[]> {
    for (const engine of CASCADE) {
        const results = await engine.search(query, maxResults);
        if (results.length > 0) return results;
    }

    return [];
}

/**
 * Expose the cascade for diagnostics / testing.
 */
export const engines: readonly SearchEngine[] = CASCADE;
