// ══════════════════════════════════════════════════════════════
// 💥 DocBreach MCP — HEAD Preflight
//
// Probe a URL for Content-Type and size without downloading
// the full body. Used by docs.discover to probe candidate URLs.
// ══════════════════════════════════════════════════════════════

import type { PreflightResult } from './types.js';
import { randomUA } from './identity.js';

/**
 * HEAD-only preflight check.
 *
 * Returns content metadata without downloading the body.
 * Fails gracefully — returns `{ exists: false }` on any error.
 */
export async function preflight(url: string, timeoutMs = 5_000): Promise<PreflightResult> {
    try {
        const response = await fetch(url, {
            method:   'HEAD',
            headers:  { 'User-Agent': randomUA() },
            redirect: 'follow',
            signal:   AbortSignal.timeout(timeoutMs),
        });

        return {
            exists:        response.ok,
            contentType:   response.headers.get('content-type') ?? '',
            contentLength: parseInt(response.headers.get('content-length') ?? '', 10) || null,
            status:        response.status,
        };
    } catch {
        return { exists: false, contentType: '', contentLength: null, status: 0 };
    }
}
