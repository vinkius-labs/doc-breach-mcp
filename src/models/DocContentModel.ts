// ══════════════════════════════════════════════════════════════
// 💥 DocBreach MCP — DocContent Model
// The clean, LLM-ready Markdown extracted from any documentation page.
// This is what the agent actually reads.
// ══════════════════════════════════════════════════════════════

import { defineModel } from '@vurb/core';

export const DocContentModel = defineModel('DocContent', m => {
    m.casts({
        url:       m.string('Source URL that was read'),
        content:   m.text('Clean Markdown content extracted from the page'),
        format:    m.enum('Detected format', ['html', 'openapi', 'json', 'yaml',
                   'llms_txt', 'markdown', 'pdf', 'postman', 'plaintext']),
        nav_links: m.list('Related documentation links found on the page', {
            title: m.string('Link text'),
            url:   m.string('Absolute URL'),
        }),
        truncated: m.boolean('Whether content was truncated due to size limits'),
        cached:    m.boolean('Whether content was served from cache'),
    });
});
