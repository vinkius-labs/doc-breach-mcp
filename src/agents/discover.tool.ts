// ══════════════════════════════════════════════════════════════
// 💥 DocBreach MCP — docs.discover
// 🕳️ TACTICAL ROLE: THE SCOUT
// First contact. The agent asks "where are the docs for X?"
// and we send probes into the wild: curated registry, HEAD probes
// on common patterns, and DuckDuckGo Lite as the universal fallback.
// ══════════════════════════════════════════════════════════════

import { docs } from './docs.router.js';
import { f } from '../vurb.js';
import { SourcePresenter } from '../views/source.presenter.js';

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
    .handle(async (input, ctx) => {
        ctx.requestCount++;

        // TODO: implement discoverSources pipeline
        // 1. Check curated registry
        // 2. HEAD probe common patterns (docs.{domain}, api.{domain}/docs)
        // 3. DuckDuckGo Lite fallback

        return f.error('NOT_IMPLEMENTED', 'docs.discover is under construction')
            .suggest('The discovery pipeline is being built. Check back soon.')
            .warning();
    });
