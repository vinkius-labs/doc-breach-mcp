// ══════════════════════════════════════════════════════════════
// 💥 DocBreach MCP — FluentRouter
// All tools live under the `docs` namespace.
// The agent sees: docs.discover, docs.read, docs.search, docs.extract, docs.map
// ══════════════════════════════════════════════════════════════

import { f } from '../vurb.js';

export const docs = f.router('docs')
    .describe('Documentation discovery and reading tools for AI agents. ' +
        'Find, read, and extract structured data from any API documentation — ' +
        'for free, without browser rendering, and without SaaS dependencies.');
