// ══════════════════════════════════════════════════════════════
// 💥 DocBreach MCP — Endpoint Filtering
// ══════════════════════════════════════════════════════════════

import type { EndpointEntry } from './openapi.js';

// ── Types ────────────────────────────────────────────────────

export interface EndpointFilters {
    readonly tag?: string;
    readonly method?: string;
    readonly search?: string;
}

// ── Public API ───────────────────────────────────────────────

/**
 * Filter endpoints by tag, method, or search text.
 */
export function filterEndpoints(
    endpoints: readonly EndpointEntry[],
    filters: EndpointFilters,
): readonly EndpointEntry[] {
    return endpoints.filter(ep => matchesAll(ep, filters));
}

// ── Internal ─────────────────────────────────────────────────

function matchesAll(ep: EndpointEntry, filters: EndpointFilters): boolean {
    if (filters.tag && ep.tag.toLowerCase() !== filters.tag.toLowerCase())  return false;
    if (filters.method && ep.method !== filters.method.toUpperCase())       return false;

    if (filters.search) {
        const q        = filters.search.toLowerCase();
        const haystack = `${ep.path} ${ep.summary} ${ep.parameters}`.toLowerCase();
        if (!haystack.includes(q)) return false;
    }

    return true;
}
