// ══════════════════════════════════════════════════════════════
// 💥 DocBreach MCP — Endpoint Presenter
// Structured API endpoint data, capped and filterable.
// When the agent sees 200 endpoints, it gets the first 30
// with a hint to filter by tag or method.
// ══════════════════════════════════════════════════════════════

import { definePresenter, ui } from '@vurb/core';
import { EndpointModel } from '../models/EndpointModel.js';

export const EndpointPresenter = definePresenter({
    name: 'Endpoints',
    schema: EndpointModel.schema,
    agentLimit: {
        max: 30,
        onTruncate: (n: number) => ui.summary(`${n} endpoints omitted. Use the "tag" or "method" parameter to filter.`),
    },
    suggestActions: (ep) => [{
        tool: 'docs.read',
        reason: `Read full documentation for ${ep.method} ${ep.path}`,
        args: { url: '' },
    }],
});
