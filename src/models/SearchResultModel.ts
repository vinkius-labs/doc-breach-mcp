// ══════════════════════════════════════════════════════════════
// 💥 DocBreach MCP — SearchResult Model
// Every documentation source discovered by the probe or search.
// ══════════════════════════════════════════════════════════════

import { defineModel } from '@vurb/core';

export const SearchResultModel = defineModel('SearchResult', m => {
    m.casts({
        url:     m.string('Full absolute URL of the documentation page'),
        title:   m.string('Page title extracted from search results'),
        snippet: m.text('Brief description or excerpt from the page'),
        type:    m.enum('Source type', ['html', 'openapi', 'swagger', 'llms_txt',
                 'github', 'postman', 'pdf', 'markdown']),
        source:  m.enum('Discovery source', ['registry', 'probe', 'search']),
    });
});
