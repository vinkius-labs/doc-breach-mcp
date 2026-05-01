// ══════════════════════════════════════════════════════════════
// 💥 DocBreach MCP — docs.search
// 🔍 TACTICAL ROLE: THE SNIPER
// When the agent already knows the domain and needs a specific page.
// DuckDuckGo Lite with site: restriction. Surgical precision.
// ══════════════════════════════════════════════════════════════

import { docs } from './docs.router.js';
import { f } from '../vurb.js';
import { SourcePresenter } from '../views/source.presenter.js';
import { searchDDG } from '../engine/index.js';

export const search = docs.query('search')
    .describe('Search for specific topics within a documentation site')
    .instructions(
        'Use this when you ALREADY know the documentation domain and need to find a specific page. ' +
        'Always provide the "site" parameter when searching within a known domain. ' +
        'Example: docs.search({ query: "authentication headers", site: "docs.stripe.com" })'
    )
    .withString('query', 'What to search for (e.g., "authentication", "create webhook")')
    .withOptionalString('site', 'Restrict search to this domain (e.g., "docs.stripe.com")')
    .returns(SourcePresenter)
    .stale()
    .concurrency({ maxActive: 5, maxQueue: 15 })
    .handle(async (input, ctx) => {
        ctx.requestCount++;

        const query = input.site
            ? `site:${input.site} ${input.query}`
            : `${input.query} API documentation`;

        const results = await searchDDG(query);

        if (results.length === 0) {
            return f.error('NO_RESULTS', `No results found for "${input.query}"`)
                .suggest(
                    'Try broadening your search. ' +
                    'Remove the site parameter or try different keywords. ' +
                    `docs.discover({ query: "${input.query}" }) may find alternative sources.`
                )
                .actions('docs.discover')
                .warning();
        }

        return results.map(r => ({
            url:     r.url,
            title:   r.title,
            snippet: r.snippet,
            type:    'html' as const,
            source:  'search' as const,
        }));
    });
