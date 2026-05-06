// ══════════════════════════════════════════════════════════════
// ⚛️ TACTICAL BYPASS: HYDRATION HIJACKING
//
// Modern doc platforms are all SPAs. fetch() returns an empty
// <body>. Instead of Puppeteer (300MB+), we steal the SSR
// payloads they leave in the DOM. The data is already there.
// They just didn't expect us to read it.
// ══════════════════════════════════════════════════════════════

// ── Types ────────────────────────────────────────────────────

export type SupportedPlatform =
    | 'nextjs'
    | 'nuxtjs'
    | 'readme'
    | 'gitbook'
    | 'gatsby';

export interface HydrationResult {
    readonly content: string | null;
    readonly platform: SupportedPlatform | null;
}

// ── Extractor Registry ───────────────────────────────────────

interface PlatformExtractor {
    readonly platform: SupportedPlatform;
    readonly extract: (html: string) => string | null;
}

const EXTRACTORS: readonly PlatformExtractor[] = [
    { platform: 'nextjs',  extract: extractNextJs },
    { platform: 'nuxtjs',  extract: extractNuxtJs },
    { platform: 'readme',  extract: extractReadMe },
    { platform: 'gitbook', extract: extractGitBook },
    { platform: 'gatsby',  extract: extractGatsby },
];

// ── Public API ───────────────────────────────────────────────

/**
 * Extract SSR-embedded content from SPA frameworks.
 *
 * First match wins. Returns `null` if the page genuinely
 * requires JS execution.
 */
export function extractSPAContent(html: string): HydrationResult {
    for (const { platform, extract } of EXTRACTORS) {
        const content = extract(html);
        if (content) return { content, platform };
    }
    return { content: null, platform: null };
}

/**
 * Check if the HTML body is effectively empty (SPA shell).
 */
export function isEmptySPA(html: string): boolean {
    const visible = html
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    return visible.length < 200;
}

// ── Platform Extractors ──────────────────────────────────────

function extractNextJs(html: string): string | null {
    const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (!match) return null;

    try {
        const payload = JSON.parse(match[1]);
        const props   = payload.props?.pageProps ?? payload;
        const candidates = [props.mdxSource, props.content, props.body, props.markdown] as const;
        const content    = candidates.find((c): c is string => typeof c === 'string');

        if (content) return content;

        // ⚛️ Empty SSR payload trap — some Next.js sites ship __NEXT_DATA__
        // with an empty props object. stringify would return "{}" which
        // looks like valid content but is useless. Reject so the agent
        // pivots to GitHub/OpenAPI alternatives.
        const stringified = stringify(props);
        return stringified.length > 10 ? stringified : null;
    } catch {
        return match[1];
    }
}

function extractNuxtJs(html: string): string | null {
    return html.match(/window\.__NUXT__\s*=\s*(\{[\s\S]*?\});?\s*<\/script>/)?.[1] ?? null;
}

function extractReadMe(html: string): string | null {
    const attrMatch = html.match(/readme-data="([^"]+)"/);
    if (attrMatch) {
        try { return stringify(JSON.parse(decodeURIComponent(attrMatch[1]))); }
        catch { return decodeURIComponent(attrMatch[1]); }
    }

    return html.match(/<script[^>]*id="readme-data"[^>]*>([\s\S]*?)<\/script>/)?.[1] ?? null;
}

function extractGitBook(html: string): string | null {
    return html.match(/window\.__GITBOOK_STATE__\s*=\s*([\s\S]*?);\s*<\/script>/)?.[1] ?? null;
}

function extractGatsby(html: string): string | null {
    return html.match(/<script[^>]*id="gatsby-chunk-mapping"[^>]*>([\s\S]*?)<\/script>/)?.[1]
        ?? html.match(/window\.___gatsby\s*=\s*(\{[\s\S]*?\});?\s*<\/script>/)?.[1]
        ?? null;
}

// ── Utilities ────────────────────────────────────────────────

const stringify = (value: unknown): string => JSON.stringify(value, null, 2);
