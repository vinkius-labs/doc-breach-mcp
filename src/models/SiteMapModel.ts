// ══════════════════════════════════════════════════════════════
// 💥 DocBreach MCP — SiteMap Model
// The structured map of a documentation site.
// ══════════════════════════════════════════════════════════════

import { defineModel } from '@vurb/core';

export const SiteMapModel = defineModel('SiteMap', m => {
    m.casts({
        domain:             m.string('Domain that was mapped'),
        total:              m.number('Total documentation pages found'),
        sources:            m.list('Discovery sources used', {
            name: m.string('Source name (llms.txt, sitemap.xml, nav_links)'),
        }),
        llms_txt_available: m.boolean('Whether the site provides an llms.txt file'),
        entries:            m.list('Documentation pages found', {
            url:         m.string('Page URL'),
            title:       m.string('Page title'),
            description: m.string('Brief page description'),
            section:     m.string('Section grouping'),
            source:      m.enum('Discovery source', ['llms_txt', 'sitemap_xml', 'nav_links']),
        }),
    });
});
