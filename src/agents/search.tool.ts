// ══════════════════════════════════════════════════════════════
// 💥 DocBreach MCP — docs.search
// 🔍 TACTICAL ROLE: THE SNIPER
// When the agent already knows the domain and needs a specific page.
// DuckDuckGo Lite with site: restriction. Surgical precision.
// ══════════════════════════════════════════════════════════════

import { docs } from './docs.router.js';
import { f } from '../vurb.js';
import { SourcePresenter } from '../views/source.presenter.js';

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
    .handle(async (input, ctx) => {
        ctx.requestCount++;

        // TODO: implement DuckDuckGo Lite search
        // Build query: site:{domain} {query} OR {query} API documentation

        return f.error('NOT_IMPLEMENTED', 'docs.search is under construction')
            .suggest('The search engine is being built. Check back soon.')
            .warning();
    });
