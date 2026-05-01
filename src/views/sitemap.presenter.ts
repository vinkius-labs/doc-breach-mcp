// ══════════════════════════════════════════════════════════════
// 💥 DocBreach MCP — SiteMap Presenter
// The egress firewall for documentation maps.
//
// Organizes entries by section and suggests docs.read actions
// for the most relevant pages. Rules guide the agent to
// prioritize auth and getting-started pages.
// ══════════════════════════════════════════════════════════════

import { definePresenter, ui } from '@vurb/core';
import { SiteMapModel } from '../models/SiteMapModel.js';

export const SiteMapPresenter = definePresenter({
    name: 'SiteMap',
    schema: SiteMapModel.schema,
    rules: [
        'When this map is returned, ALWAYS prioritize reading "Authentication", "Getting Started", or "Quickstart" pages BEFORE any other documentation.',
        'Use the URLs from this map directly with docs.read — do not guess or construct URLs.',
        'If the map shows llms_txt_available: true, the documentation is AI-optimized. Trust its structure.',
        'If the map has multiple sections, read the most relevant section for the user\'s task first.',
    ],
    agentLimit: {
        max: 1,
        onTruncate: () => ui.summary('Site map truncated. Use the sections to navigate.'),
    },
    suggestActions: (map: { sections?: Record<string, Array<{ url: string; title: string }>> }) => {
        const actions: Array<{ tool: string; reason: string; args: Record<string, string> }> = [];

        if (!map.sections) return actions;

        // Suggest reading the most important pages
        const allEntries = Object.values(map.sections).flat();
        const priorityPatterns = [/auth/i, /getting.?started/i, /quickstart/i, /overview/i, /introduction/i];

        for (const pattern of priorityPatterns) {
            const match = allEntries.find(e => pattern.test(e.title) || pattern.test(e.url));
            if (match) {
                actions.push({
                    tool: 'docs.read',
                    reason: `Read "${match.title}" — recommended starting point`,
                    args: { url: match.url },
                });
                break; // Only suggest the top priority
            }
        }

        // Suggest the first entry as fallback
        if (actions.length === 0 && allEntries.length > 0) {
            actions.push({
                tool: 'docs.read',
                reason: `Read "${allEntries[0].title}"`,
                args: { url: allEntries[0].url },
            });
        }

        return actions;
    },
});
