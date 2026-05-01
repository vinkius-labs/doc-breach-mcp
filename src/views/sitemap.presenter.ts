// ══════════════════════════════════════════════════════════════
// 💥 DocBreach MCP — SiteMap Presenter
// The egress firewall for documentation maps.
//
// Organizes entries by section and suggests docs.read actions
// for the most relevant pages. Rules guide the agent to
// prioritize auth and getting-started pages.
// ══════════════════════════════════════════════════════════════

import { createPresenter, ui } from '@vurb/core';
import { SiteMapModel } from '../models/SiteMapModel.js';

export const SiteMapPresenter = createPresenter('SiteMap')
    .schema(SiteMapModel.schema)
    .systemRules([
        'When this map is returned, ALWAYS prioritize reading "Authentication", "Getting Started", or "Quickstart" pages BEFORE any other documentation.',
        'Use the URLs from this map directly with docs.read — do not guess or construct URLs.',
        'If the map has multiple sections, read the most relevant section for the user\'s task first.',
    ])
    .systemRules((map: { llms_txt_available?: boolean }) => {
        if (map.llms_txt_available) {
            return ['The documentation is AI-optimized (llms.txt). Trust its structure and expect clean markdown.'];
        }
        return ['The site lacks llms.txt. Expect to read standard HTML converted to Markdown. Pay attention to code blocks.'];
    })
    .uiBlocks((map: { domain?: string; sections?: Record<string, Array<{ title: string; url: string }>> }) => {
        if (!map.sections || Object.keys(map.sections).length === 0 || !map.domain) return [];
        
        let graph = 'graph TD;\n';
        const root = map.domain.replace(/[^a-zA-Z0-9]/g, '_');
        graph += `  ${root}["${map.domain}"]\n`;
        
        // Render up to 5 sections to avoid giant graphs
        const sectionsToRender = Object.entries(map.sections).slice(0, 5);
        for (let i = 0; i < sectionsToRender.length; i++) {
            const [sectionName, links] = sectionsToRender[i];
            const sectionNode = `sec_${i}`;
            // Clean sectionName for Mermaid label (quotes)
            graph += `  ${root} --> ${sectionNode}["${sectionName.replace(/"/g, "'")}"]\n`;
            
            // Render up to 3 links per section
            const linksToRender = links.slice(0, 3);
            for (let j = 0; j < linksToRender.length; j++) {
                const link = linksToRender[j];
                const linkNode = `link_${i}_${j}`;
                graph += `  ${sectionNode} --> ${linkNode}["${link.title.replace(/"/g, "'")}"]\n`;
            }
            if (links.length > 3) {
                graph += `  ${sectionNode} --> more_${i}["... ${links.length - 3} more"]\n`;
            }
        }
        
        return [ui.mermaid(graph)];
    })
    .agentLimit(1, () => ui.summary('Site map truncated. Use the sections to navigate.'))
    .suggestActions((map: { sections?: Record<string, Array<{ url: string; title: string }>> }) => {
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
    });
