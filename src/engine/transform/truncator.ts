// ══════════════════════════════════════════════════════════════
// 💥 DocBreach MCP — Boundary-Aware Truncation
//
// When a 200KB doc page hits the wire, we don't cut at byte N.
// We find the nearest Markdown heading or paragraph boundary
// and cut cleanly. The agent reads complete sections.
// ══════════════════════════════════════════════════════════════

// ── Types ────────────────────────────────────────────────────

export interface TruncationResult {
    readonly content: string;
    readonly truncated: boolean;
    readonly originalLength: number;
}

// ── Boundary Patterns ────────────────────────────────────────

const BOUNDARIES: readonly RegExp[] = [
    /\n#{1,6}\s/,       // Markdown heading
    /\n\n/,             // Paragraph break
    /\.\s/,             // Sentence boundary
    /\s/,               // Word boundary (last resort)
];

// ── Public API ───────────────────────────────────────────────

/**
 * Truncate content at the nearest clean boundary.
 *
 * Walks backward from `maxLength` to find the best cut point.
 * Appends a truncation notice for the agent.
 */
export function truncate(content: string, maxLength: number): TruncationResult {
    if (content.length <= maxLength) {
        return { content, truncated: false, originalLength: content.length };
    }

    const cutPoint  = findBoundary(content, maxLength);
    const truncated = content.slice(0, cutPoint).trimEnd();

    const notice = [
        '', '---',
        `> ⚠️ Content truncated at ${formatSize(cutPoint)} of ${formatSize(content.length)}.`,
        '> Use `docs.search` with specific keywords to find the section you need.',
    ].join('\n');

    return { content: truncated + notice, truncated: true, originalLength: content.length };
}

// ── Internal ─────────────────────────────────────────────────

function findBoundary(content: string, maxLength: number): number {
    const searchStart = Math.floor(maxLength * 0.8);
    const searchSlice = content.slice(searchStart, maxLength);

    for (const pattern of BOUNDARIES) {
        const index = findLastMatch(searchSlice, pattern);
        if (index !== -1) return searchStart + index;
    }

    return maxLength;
}

function findLastMatch(text: string, pattern: RegExp): number {
    let last = -1;
    for (const match of text.matchAll(new RegExp(pattern.source, 'g'))) {
        last = match.index!;
    }
    return last;
}

function formatSize(chars: number): string {
    return chars < 1024 ? `${chars} chars` : `${(chars / 1024).toFixed(1)}KB`;
}
