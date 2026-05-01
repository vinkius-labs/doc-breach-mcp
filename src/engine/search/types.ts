// ══════════════════════════════════════════════════════════════
// 💥 DocBreach MCP — Search Types
//
// Shared contract for ALL search engines in the cascade.
// DDG, SearXNG, Google Lite — they all speak SearchResult.
// ══════════════════════════════════════════════════════════════

export interface SearchResult {
    readonly url: string;
    readonly title: string;
    readonly snippet: string;
}

/**
 * 🛡️ SearchEngine Interface — The Cascade Contract
 *
 * Every engine in the cascade implements this interface.
 * The orchestrator tries them in order until one returns results.
 * If all fail, the cascade returns an empty array — gracefully.
 */
export interface SearchEngine {
    /** Human-readable name for logging and diagnostics. */
    readonly name: string;

    /**
     * Execute a search query.
     * Must fail gracefully — return [] on error, never throw.
     */
    search(query: string, maxResults: number): Promise<readonly SearchResult[]>;
}
