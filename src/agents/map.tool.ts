// ══════════════════════════════════════════════════════════════
// 💥 DocBreach MCP — docs.map
// 🗺️ TACTICAL ROLE: THE CARTOGRAPHER
//
// One call to map an entire documentation site.
// Probes llms.txt → sitemap.xml → homepage nav links.
// Returns a structured table of contents — every page, every
// section, every URL. The agent never has to guess again.
//
// This tool eliminates 80% of blind docs.read calls.
// Instead of: "let me try /docs/auth... nope... /api/auth..."
// The agent gets the FULL map and picks the right page first.
// ══════════════════════════════════════════════════════════════

import { docs } from './docs.router.js';
import { f } from '../vurb.js';
import { SiteMapPresenter } from '../views/sitemap.presenter.js';
import { mapDocs, DocCache } from '../engine/index.js';

export const map = docs.query('map')
    .describe('Map the complete documentation structure of any domain')
    .instructions(
        'Use this as the FIRST step when exploring a new API or documentation site. ' +
        'Provide a domain (e.g., "stripe.com") and receive a complete table of contents ' +
        'with every documentation page organized by section. ' +
        'Then use docs.read on specific pages from the map.'
    )
    .withString('domain', 'Domain to map (e.g., "stripe.com", "docs.github.com")')
    .returns(SiteMapPresenter)
    .handle(async (input, ctx) => {
        ctx.requestCount++;

        const domain = input.domain
            .replace(/^https?:\/\//, '')
            .replace(/\/.*$/, '')
            .trim();

        if (!domain || !domain.includes('.')) {
            return f.error('INVALID_DOMAIN', `"${input.domain}" is not a valid domain`)
                .suggest('Provide a clean domain like "stripe.com" or "docs.github.com"')
                .warning();
        }

        // Check cache
        const cached = mapCache.get(domain);
        if (cached) {
            return cached;
        }

        const result = await mapDocs(domain);

        if (result.total === 0) {
            return f.error('NO_PAGES', `Could not map any documentation pages for "${domain}"`)
                .suggest(`Try: docs.discover({ query: "${domain} API documentation" }) to find the docs URL first.`)
                .actions('docs.discover')
                .warning();
        }

        // Build the response
        const response = {
            domain:             result.domain,
            total:              result.total,
            sources:            result.sources,
            llms_txt_available: result.llms_txt_available,
            sections:           result.sections,
        };

        mapCache.set(domain, response);
        return response;
    });

// ── Map Cache ────────────────────────────────────────────────
// 🛡️ Site maps don't change frequently. 30 min TTL is generous.

const mapCache = new DocCache<Record<string, unknown>>(30 * 60 * 1000);
