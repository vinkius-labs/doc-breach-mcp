// ══════════════════════════════════════════════════════════════
// 💥 DocBreach MCP — docs.discover
// 🕳️ TACTICAL ROLE: THE SCOUT
//
// First contact. The agent asks "where are the docs for X?"
// and we send probes into the wild:
//   1. HEAD probe known doc patterns ({domain}/docs, /api-docs, etc.)
//   2. DuckDuckGo Lite fallback for everything else
//
// Zero API keys. Zero auth. Maximum coverage.
// ══════════════════════════════════════════════════════════════

import { docs } from './docs.router.js';
import { f } from '../vurb.js';
import { SourcePresenter } from '../views/source.presenter.js';
import { preflight, searchDDG, detectFormat } from '../engine/index.js';

// ── Known Doc Patterns ───────────────────────────────────────
//
// When the query looks like a domain or service name, we
// HEAD-probe these patterns before falling back to search.
// Most doc platforms follow predictable URL conventions.

const DOC_PATH_PATTERNS: readonly string[] = [
    '/docs',
    '/documentation',
    '/api-docs',
    '/api/docs',
    '/developer',
    '/developers',
    '/reference',
    '/api-reference',
    '/llms.txt',
    '/llms-full.txt',
];

// ── Tool Definition ──────────────────────────────────────────

export const discover = docs.query('discover')
    .describe('Find documentation sources for any service, library, or API')
    .instructions(
        'Use this as the FIRST step when you need to find documentation. ' +
        'Use specific, descriptive queries. Example: "stripe API webhooks" ' +
        'instead of just "stripe". Combine your search intents into a single query. ' +
        'Do NOT call this tool in rapid loops — refine your query instead.'
    )
    .withString('query', 'What to search for (e.g., "datadog API monitoring endpoints")')
    .returns(SourcePresenter)
    .stale()
    .concurrency({ maxActive: 5, maxQueue: 15 })
    .handle(async (input, ctx) => {
        ctx.requestCount++;

        const results: Array<{
            url:     string;
            title:   string;
            snippet: string;
            type:    string;
            source:  string;
        }> = [];

        // ── Phase 1: Probe known patterns ────────────────────
        const domain = extractDomain(input.query);

        if (domain) {
            const probeResults = await probeDocPatterns(domain);
            results.push(...probeResults);
        }

        // ── Phase 2: DuckDuckGo Lite search ──────────────────
        const searchQuery = `${input.query} API documentation`;
        const searchResults = await searchDDG(searchQuery, 10);

        for (const r of searchResults) {
            if (!results.some(existing => existing.url === r.url)) {
                results.push({
                    url:     r.url,
                    title:   r.title,
                    snippet: r.snippet,
                    type:    'html',
                    source:  'search',
                });
            }
        }

        // ── No results — self-healing error ──────────────────
        if (results.length === 0) {
            return f.error('NO_RESULTS', `No documentation found for "${input.query}"`)
                .suggest(
                    'Try searching for community SDKs: ' +
                    `docs.search({ query: "${input.query} API client OR SDK site:github.com" }). ` +
                    'Read SDK source code to reverse-engineer routes and authentication.'
                )
                .actions('docs.search')
                .warning();
        }

        return results;
    });

// ── Domain Extraction ────────────────────────────────────────
//
// Heuristic: if the query looks like "stripe" or "docs.stripe.com",
// extract a probable domain to HEAD-probe.

function extractDomain(query: string): string | null {
    // Already a domain/URL
    if (query.includes('.') && !query.includes(' ')) {
        const cleaned = query.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
        if (cleaned.includes('.')) return cleaned;
    }

    // Single word → try {word}.com as a heuristic
    const words = query.trim().split(/\s+/);
    if (words.length === 1 && /^[a-z0-9-]+$/i.test(words[0])) {
        return `${words[0].toLowerCase()}.com`;
    }

    return null;
}

// ── Doc Pattern Probing ──────────────────────────────────────

async function probeDocPatterns(domain: string): Promise<Array<{
    url:     string;
    title:   string;
    snippet: string;
    type:    string;
    source:  string;
}>> {
    const results: Array<{
        url:     string;
        title:   string;
        snippet: string;
        type:    string;
        source:  string;
    }> = [];

    // Probe base domain + common subdomains
    const bases = [
        `https://${domain}`,
        `https://docs.${domain}`,
        `https://developer.${domain}`,
        `https://developers.${domain}`,
    ];

    // Parallel HEAD probes — fast and cheap
    const probes = bases.flatMap(base =>
        DOC_PATH_PATTERNS.map(path => ({
            url:  `${base}${path}`,
            base,
            path,
        }))
    );

    const checks = await Promise.allSettled(
        probes.map(async probe => {
            const result = await preflight(probe.url, 3_000);
            return { ...probe, ...result };
        })
    );

    for (const check of checks) {
        if (check.status !== 'fulfilled' || !check.value.exists) continue;

        const { url, contentType } = check.value;
        const type = classifyContentType(url, contentType);

        results.push({
            url,
            title:   `${domain} — ${url.split('/').pop() ?? 'Documentation'}`,
            snippet: `Discovered via HEAD probe (${contentType.split(';')[0]})`,
            type,
            source:  'probe',
        });
    }

    return results;
}

// ── Content-Type Classification ──────────────────────────────

function classifyContentType(url: string, contentType: string): string {
    if (url.endsWith('/llms.txt') || url.endsWith('/llms-full.txt')) return 'llms_txt';
    if (contentType.includes('application/json'))                   return 'openapi';
    if (contentType.includes('application/yaml'))                   return 'openapi';
    if (contentType.includes('application/pdf'))                    return 'pdf';
    return 'html';
}
