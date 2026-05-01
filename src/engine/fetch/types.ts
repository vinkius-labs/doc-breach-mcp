// ══════════════════════════════════════════════════════════════
// 💥 DocBreach MCP — Fetch Types
// ══════════════════════════════════════════════════════════════

/** Response from the fetcher with provenance metadata. */
export interface FetchResult {
    readonly url: string;
    readonly body: string;
    readonly contentType: string;
    readonly status: number;
    readonly redirectedUrl?: string;
    readonly fromArchive: boolean;
}

/** HEAD-only preflight probe result. */
export interface PreflightResult {
    readonly exists: boolean;
    readonly contentType: string;
    readonly contentLength: number | null;
    readonly status: number;
}
