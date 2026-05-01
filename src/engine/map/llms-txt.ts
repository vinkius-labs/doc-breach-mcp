// ══════════════════════════════════════════════════════════════
// 💥 DocBreach MCP — llms.txt Parser
// 📜 TACTICAL ROLE: THE DECODER
//
// llms.txt is the FUTURE of AI-readable documentation.
// A structured plaintext file at /llms.txt that tells agents
// exactly where to find auth docs, quickstarts, and API refs.
//
// When a site has llms.txt, we skip everything else.
// It's the golden source — written BY developers FOR agents.
//
// Spec: https://llmstxt.org
// ══════════════════════════════════════════════════════════════

import type { SiteMapEntry } from './types.js';

// ── Section Pattern ──────────────────────────────────────────
//
// llms.txt format:
//   # Site Title
//   > Brief description
//
//   ## Section Name
//   - [Link Title](https://url): Description
//   - [Another Link](https://url): Description

const SECTION_RE  = /^##\s+(.+)$/gm;
const LINK_RE     = /^-\s+\[([^\]]+)\]\(([^)]+)\)(?:\s*:\s*(.+))?$/gm;
const TITLE_RE    = /^#\s+(.+)$/m;
const DESC_RE     = /^>\s+(.+)$/m;

// ── Types ────────────────────────────────────────────────────

export interface LlmsTxtResult {
    readonly title: string;
    readonly description: string;
    readonly entries: readonly SiteMapEntry[];
    readonly raw: string;
}

// ── Public API ───────────────────────────────────────────────

/**
 * Parse an llms.txt file into structured entries.
 *
 * Returns title, description, and all linked pages organized
 * by section. Each entry includes the section as its category.
 */
export function parseLlmsTxt(content: string): LlmsTxtResult {
    const title       = content.match(TITLE_RE)?.[1]?.trim() ?? '';
    const description = content.match(DESC_RE)?.[1]?.trim() ?? '';

    // Extract sections and their positions
    const sections: Array<{ name: string; start: number }> = [];
    for (const match of content.matchAll(SECTION_RE)) {
        sections.push({ name: match[1].trim(), start: match.index! });
    }

    const entries: SiteMapEntry[] = [];

    if (sections.length === 0) {
        // No sections — parse all links as top-level
        for (const match of content.matchAll(new RegExp(LINK_RE.source, LINK_RE.flags))) {
            entries.push({
                url:         match[2],
                title:       match[1],
                description: match[3]?.trim() ?? '',
                section:     'Documentation',
                source:      'llms_txt',
            });
        }
    } else {
        // Parse links within each section
        for (let i = 0; i < sections.length; i++) {
            const section   = sections[i];
            const nextStart = sections[i + 1]?.start ?? content.length;
            const block     = content.slice(section.start, nextStart);

            for (const match of block.matchAll(new RegExp(LINK_RE.source, LINK_RE.flags))) {
                entries.push({
                    url:         match[2],
                    title:       match[1],
                    description: match[3]?.trim() ?? '',
                    section:     section.name,
                    source:      'llms_txt',
                });
            }
        }
    }

    return { title, description, entries, raw: content };
}
