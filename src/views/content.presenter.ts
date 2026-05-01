// ══════════════════════════════════════════════════════════════
// 💥 DocBreach MCP — Content Presenter
// The cognitive firewall. This is where the real magic happens.
//
// .rules() inject system-level instructions WITH every response.
// The LLM reads "Read the Auth page BEFORE generating code"
// and FOLLOWS it. No prompt engineering needed on the user side.
// ══════════════════════════════════════════════════════════════

import { createPresenter, ui } from '@vurb/core';
import { DocContentModel } from '../models/DocContentModel.js';

export const ContentPresenter = createPresenter('DocContent')
    .schema(DocContentModel.schema)
    .systemRules([
        'If the Related Documentation Links section shows an "Authentication" or "Getting Started" page, read it BEFORE generating integration code.',
        'Never guess URL patterns — use only URLs from the content or Related Links.',
        'If the documentation mentions multiple regions, sites, or environments, ALWAYS include a selector in your generated code.',
        'If the content mentions API keys, tokens, or headers, extract ALL credential requirements before writing code.',
    ])
    .systemRules((doc: { truncated?: boolean; content?: string }) => {
        const rules = [];
        if (doc.truncated) {
            rules.push('CRITICAL: The content was truncated! The full page was too large. DO NOT ASSUME this is the full page. Use docs.search to find missing sections if needed.');
        }
        if (!doc.content || doc.content.length < 100) {
            rules.push('If content appears empty or contains only navigation scaffolding, the page likely requires JavaScript rendering. Try: docs.search({ query: "<topic> site:github.com" }) to find the source repository, then docs.read the README or raw Markdown files.');
        }
        return rules;
    })
    .agentLimit(1, (n: number) => ui.summary(`Content truncated. Use docs.search to find specific sections.`))
    .suggestActions((doc: { nav_links?: Array<{ url: string }>; truncated?: boolean; url?: string }) => {
        const actions: Array<{ tool: string; reason: string; args: Record<string, string> }> = [];
        if (doc.nav_links?.length && doc.nav_links[0]?.url) {
            actions.push({
                tool: 'docs.read',
                reason: 'Read a related documentation page',
                args: { url: doc.nav_links[0].url },
            });
        }
        if (doc.truncated && doc.url) {
            try {
                const domain = new URL(doc.url).hostname;
                actions.push({
                    tool: 'docs.search',
                    reason: 'Content was truncated — search for specific topics on this site',
                    args: { query: '', site: domain },
                });
            } catch {
                // Ignore invalid URLs
            }
        }
        return actions;
    });
