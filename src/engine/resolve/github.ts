// ══════════════════════════════════════════════════════════════
// 💥 DocBreach MCP — GitHub URL Resolver
//
// github.com/owner/repo/blob/main/docs/api.md
// → raw.githubusercontent.com/owner/repo/main/docs/api.md
//
// One registry. Zero API calls. Infinite time saved.
// ══════════════════════════════════════════════════════════════

// ── Types ────────────────────────────────────────────────────

export interface ResolvedGitHubUrl {
    readonly raw: string;
    readonly owner: string;
    readonly repo: string;
    readonly path: string;
    readonly ref: string;
}

// ── Resolver Registry ────────────────────────────────────────

interface UrlResolver {
    readonly pattern: RegExp;
    readonly resolve: (match: RegExpMatchArray) => ResolvedGitHubUrl;
}

const RAW_BASE = 'https://raw.githubusercontent.com';

const RESOLVERS: readonly UrlResolver[] = [
    {
        pattern: /^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)$/,
        resolve: ([, owner, repo, ref, path]) => ({
            raw: `${RAW_BASE}/${owner}/${repo}/${ref}/${path}`,
            owner, repo, path, ref,
        }),
    },
    {
        pattern: /^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/tree\/([^/]+)\/(.+)$/,
        resolve: ([, owner, repo, ref, path]) => ({
            raw: `${RAW_BASE}/${owner}/${repo}/${ref}/${path}/README.md`,
            owner, repo, path: `${path}/README.md`, ref,
        }),
    },
    {
        pattern: /^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/?$/,
        resolve: ([, owner, repo]) => ({
            raw: `${RAW_BASE}/${owner}/${repo}/HEAD/README.md`,
            owner, repo, path: 'README.md', ref: 'HEAD',
        }),
    },
];

// ── Public API ───────────────────────────────────────────────

/**
 * Resolve a GitHub URL to its raw content equivalent.
 * Returns `null` for non-GitHub URLs.
 */
export function resolveGitHubUrl(url: string): ResolvedGitHubUrl | null {
    for (const { pattern, resolve } of RESOLVERS) {
        const match = url.match(pattern);
        if (match) return resolve(match);
    }
    return null;
}

/** Check if a URL points to GitHub. */
export function isGitHubUrl(url: string): boolean {
    return url.startsWith('https://github.com/') || url.startsWith('http://github.com/');
}
