// ══════════════════════════════════════════════════════════════
// 💥 DocBreach MCP — docs.read
// 🛡️ TACTICAL ROLE: THE BREACHER
// The 11-step pipeline. Fetch, detect, bypass, clean, convert.
// This is where Cloudflare walls crumble and SPAs get hijacked.
// ══════════════════════════════════════════════════════════════

import { docs } from './docs.router.js';
import { f } from '../vurb.js';
import { ContentPresenter } from '../views/content.presenter.js';

export const read = docs.query('read')
    .describe('Read any documentation URL and return clean, LLM-ready Markdown')
    .instructions(
        'Reads a documentation page and returns clean Markdown. ' +
        'Handles HTML, JSON, YAML, OpenAPI specs, Postman Collections, PDFs (<5MB), and llms.txt. ' +
        'The response includes a "Related Documentation Links" section extracted from page navigation. ' +
        'ALWAYS check these links for authentication and getting-started pages before generating code.'
    )
    .withString('url', 'Full URL of the documentation page to read')
    .withOptionalNumber('max_length', 'Maximum output length in characters (default: 20000)')
    .returns(ContentPresenter)
    .concurrency({ maxActive: 3, maxQueue: 5 })
    .egress(100_000)
    .handle(async (input, ctx) => {
        ctx.requestCount++;

        // TODO: implement readDocumentation 11-step pipeline
        // 1. Preflight → 2. Fetch → 3. Login detect → 4. Format detect
        // 5. PDF → 6. Spec summary → 7. SPA hydration → 8. Nav extract
        // 9. iFrame intel → 10. HTML clean → 11. Markdown convert

        return f.error('NOT_IMPLEMENTED', 'docs.read is under construction')
            .suggest('The 11-step reader pipeline is being built. Check back soon.')
            .warning();
    });
