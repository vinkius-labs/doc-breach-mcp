// ══════════════════════════════════════════════════════════════
// 💥 DocBreach MCP — Source Presenter
// The egress firewall for discovery and search results.
// Every result comes with a pre-built docs.read action —
// the agent doesn't have to figure out what to do next.
// ══════════════════════════════════════════════════════════════

import { createPresenter, ui } from '@vurb/core';
import { SearchResultModel } from '../models/SearchResultModel.js';

export const SourcePresenter = createPresenter('DocSources')
    .schema(SearchResultModel.schema)
    .agentLimit(10, (n: number) => ui.summary(`${n} results omitted. Refine your query to get more specific results.`))
    .suggestActions((source: { url?: string | null; title?: string | null }) => [
        {
            tool: 'docs.read',
            reason: `Read the documentation at ${source.title ?? source.url}`,
            args: { url: source.url ?? '' },
        },
    ]);
