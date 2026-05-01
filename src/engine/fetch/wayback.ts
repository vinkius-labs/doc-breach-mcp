// ══════════════════════════════════════════════════════════════
// ⏱️ TACTICAL BYPASS: THE TIME MACHINE
//
// If the target is hiding behind a WAF (HTTP 403/503), we pivot
// to the Wayback Machine and fetch the ghost of the API from
// last week. Checkmate, Cloudflare.
// ══════════════════════════════════════════════════════════════

import type { FetchResult } from './types.js';
import { randomUA } from './identity.js';

// ── Configuration ────────────────────────────────────────────

const WAYBACK_API   = 'https://archive.org/wayback/available';
const LOOKUP_TIMEOUT = 5_000;
const FETCH_TIMEOUT  = 10_000;

// ── Types ────────────────────────────────────────────────────

interface WaybackResponse {
    readonly archived_snapshots?: {
        readonly closest?: {
            readonly url?: string;
            readonly status?: string;
        };
    };
}

// ── Public API ───────────────────────────────────────────────

/**
 * Attempt to retrieve a URL from the Wayback Machine.
 *
 * Queries the Wayback availability API for a recent snapshot
 * (~7 days), then fetches the archived version if available.
 *
 * Returns `null` if no usable snapshot exists.
 */
export async function fetchFromArchive(url: string): Promise<FetchResult | null> {
    try {
        const snapshot = await lookupSnapshot(url);
        if (!snapshot) return null;

        const archived = await fetch(snapshot, {
            headers: { 'User-Agent': randomUA() },
            signal:  AbortSignal.timeout(FETCH_TIMEOUT),
        });

        return {
            url,
            body:          await archived.text(),
            contentType:   archived.headers.get('content-type') ?? 'text/html',
            status:        archived.status,
            redirectedUrl: snapshot,
            fromArchive:   true,
        };
    } catch {
        return null;
    }
}

// ── Internal ─────────────────────────────────────────────────

async function lookupSnapshot(url: string): Promise<string | null> {
    const timestamp = recentTimestamp();
    const apiUrl    = `${WAYBACK_API}?url=${encodeURIComponent(url)}&timestamp=${timestamp}`;

    const response = await fetch(apiUrl, { signal: AbortSignal.timeout(LOOKUP_TIMEOUT) });
    const data     = await response.json() as WaybackResponse;

    const snapshot = data.archived_snapshots?.closest;
    return (snapshot?.url && snapshot.status === '200') ? snapshot.url : null;
}

function recentTimestamp(): string {
    const d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return d.toISOString().replace(/[-:T]/g, '').slice(0, 14);
}
