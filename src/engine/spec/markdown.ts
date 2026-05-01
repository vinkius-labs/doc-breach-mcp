// ══════════════════════════════════════════════════════════════
// 💥 DocBreach MCP — Spec → Markdown Conversion
// ══════════════════════════════════════════════════════════════

import type { SpecSummary } from './openapi.js';
import { groupBy } from '../shared/utils.js';

/**
 * Convert a spec summary to LLM-ready Markdown.
 *
 * Groups endpoints by tag with compact `METHOD /path` format.
 */
export function specToMarkdown(summary: SpecSummary): string {
    const lines: string[] = [
        `# ${summary.title} (v${summary.version})`,
        '',
        summary.description,
        '',
        `**Base URL:** \`${summary.baseUrl}\``,
        '',
        `**Tags:** ${summary.tags.join(', ')}`,
        '',
        `**Total endpoints:** ${summary.endpoints.length}`,
        '',
        '---',
        '',
    ];

    const byTag = groupBy(summary.endpoints, e => e.tag);

    for (const [tag, eps] of Object.entries(byTag)) {
        lines.push(`## ${tag}`, '');
        for (const ep of eps) {
            lines.push(`- \`${ep.method} ${ep.path}\` — ${ep.summary}`);
            if (ep.parameters) lines.push(`  Parameters: ${ep.parameters}`);
        }
        lines.push('');
    }

    return lines.join('\n');
}
