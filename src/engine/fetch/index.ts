// ══════════════════════════════════════════════════════════════
// 💥 DocBreach MCP — HTTP Fetcher (Orchestrator)
//
// Composes identity, WAF detection, and Wayback fallback
// into a single fetch pipeline. This is the only entry point
// for all HTTP GETs in the engine.
// ══════════════════════════════════════════════════════════════

export type { FetchResult, PreflightResult } from './types.js';

import type { FetchResult } from './types.js';
import { randomUA, DEFAULT_HEADERS } from './identity.js';
import { isWafChallenge } from './waf.js';
import { fetchFromArchive } from './wayback.js';

export { preflight } from './preflight.js';

/**
 * Fetch a URL with WAF bypass and Wayback fallback.
 *
 * Pipeline:
 * 1. GET with browser User-Agent + Accept headers
 * 2. If 403/503 or WAF challenge → Wayback Machine temporal proxy
 * 3. Return clean FetchResult with provenance metadata
 */
export async function fetchUrl(url: string, timeoutMs = 15_000): Promise<FetchResult> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, {
            headers:  { 'User-Agent': randomUA(), ...DEFAULT_HEADERS },
            redirect: 'follow',
            signal:   controller.signal,
        });

        const body        = await response.text();
        const contentType = response.headers.get('content-type') ?? '';
        const redirected  = response.redirected ? response.url : undefined;

        // 🛡️ WAF/block detection — pivot to temporal bypass
        const isBlocked = response.status === 403
                       || response.status === 503
                       || isWafChallenge(body);

        if (isBlocked) {
            const archived = await fetchFromArchive(url);
            if (archived) return archived;
        }

        return { url, body, contentType, status: response.status, redirectedUrl: redirected, fromArchive: false };
    } finally {
        clearTimeout(timer);
    }
}
