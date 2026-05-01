// ══════════════════════════════════════════════════════════════
// 💥 DocBreach MCP — docs.extract
// 📋 TACTICAL ROLE: THE SURGEON
// Precision endpoint extraction from OpenAPI/Swagger/Postman specs.
// Tag filtering, method filtering, keyword search.
// Returns structured data, not raw YAML walls.
// ══════════════════════════════════════════════════════════════

import { docs } from './docs.router.js';
import { f } from '../vurb.js';
import { EndpointPresenter } from '../views/endpoint.presenter.js';
import { fetchUrl, summarizeSpec, filterEndpoints, DocCache } from '../engine/index.js';
import type { EndpointFilters } from '../engine/index.js';

export const extract = docs.query('extract')
    .describe('Extract structured endpoint information from an OpenAPI, Swagger, or Postman spec')
    .instructions(
        'Use this ONLY when docs.read has identified an OpenAPI/Swagger spec URL or Postman Collection. ' +
        'Provide a tag to filter endpoints by API group. ' +
        'If no tag is provided, returns a summary of all tags with endpoint counts.'
    )
    .withString('url', 'URL of the OpenAPI/Swagger spec or Postman Collection')
    .withOptionalString('tag', 'Filter by API tag (e.g., "monitors", "users")')
    .withOptionalEnum('method', ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const, 'Filter by HTTP method')
    .withOptionalString('search', 'Search endpoint descriptions')
    .returns(EndpointPresenter)
    .handle(async (input, ctx) => {
        ctx.requestCount++;

        // 1. Fetch the spec (with caching)
        const cached = specCache.get(input.url);
        let raw: string;

        if (cached) {
            raw = cached;
        } else {
            const result = await fetchUrl(input.url);

            if (result.status >= 400) {
                return f.error('FETCH_FAILED', `Failed to fetch spec: HTTP ${result.status}`)
                    .suggest('Verify the URL points to a valid OpenAPI/Swagger JSON or YAML spec.')
                    .warning();
            }

            raw = result.body;
            specCache.set(input.url, raw);
        }

        // 2. Parse and summarize
        let summary;
        try {
            summary = summarizeSpec(raw);
        } catch {
            return f.error('PARSE_FAILED', 'Could not parse the spec. Ensure it is valid OpenAPI, Swagger, or Postman JSON/YAML.')
                .suggest('Try docs.read({ url: "..." }) to read the spec as raw content instead.')
                .actions('docs.read')
                .warning();
        }

        // 3. Filter
        const filters: EndpointFilters = {
            ...(input.tag    ? { tag: input.tag }       : {}),
            ...(input.method ? { method: input.method } : {}),
            ...(input.search ? { search: input.search } : {}),
        };

        const filtered = filterEndpoints(summary.endpoints, filters);

        if (filtered.length === 0) {
            const availableTags = summary.tags.join(', ');
            return f.error('NO_ENDPOINTS', `No endpoints match your filters. Available tags: ${availableTags}`)
                .suggest(`Try: docs.extract({ url: "${input.url}", tag: "${summary.tags[0] ?? ''}" })`)
                .warning();
        }

        return filtered.map(ep => ({
            method:     ep.method,
            path:       ep.path,
            summary:    ep.summary,
            tag:        ep.tag,
            parameters: ep.parameters,
        }));
    });

// ── Spec Cache ───────────────────────────────────────────────

const specCache = new DocCache<string>(10 * 60 * 1000); // 10 min TTL
