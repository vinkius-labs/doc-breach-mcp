// ══════════════════════════════════════════════════════════════
// 💥 DocBreach MCP — Shared Utilities
//
// Pure utility functions shared across engine submodules.
// Zero side effects. Zero dependencies. Zero excuses to duplicate.
// ══════════════════════════════════════════════════════════════

/**
 * Safely resolve a relative URL against a base URL.
 * Returns `null` on invalid input instead of throwing.
 */
export function resolveUrl(href: string, baseUrl: string): string | null {
    try {
        return new URL(href, baseUrl).href;
    } catch {
        return null;
    }
}

/**
 * Group an array of items by a key function.
 */
export function groupBy<T>(items: readonly T[], key: (item: T) => string): Record<string, T[]> {
    const groups: Record<string, T[]> = {};
    for (const item of items) {
        (groups[key(item)] ??= []).push(item);
    }
    return groups;
}

/**
 * Strip HTML tags and decode common entities.
 */
export function stripHtml(html: string): string {
    let text = html.replace(/<[^>]+>/g, '');
    for (const [entity, char] of HTML_ENTITIES) {
        text = text.replaceAll(entity, char);
    }
    return text;
}

const HTML_ENTITIES: ReadonlyMap<string, string> = new Map([
    ['&amp;', '&'], ['&lt;', '<'], ['&gt;', '>'], ['&quot;', '"'], ['&#39;', "'"],
]);
