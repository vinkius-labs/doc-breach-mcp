// ══════════════════════════════════════════════════════════════
// 💥 DocBreach MCP — OpenAPI/Swagger Spec Parser
// ══════════════════════════════════════════════════════════════

import YAML from 'yaml';

// ── Types ────────────────────────────────────────────────────

export interface EndpointEntry {
    readonly method: string;
    readonly path: string;
    readonly summary: string;
    readonly tag: string;
    readonly parameters: string;
}

export interface SpecSummary {
    readonly title: string;
    readonly version: string;
    readonly description: string;
    readonly baseUrl: string;
    readonly endpoints: readonly EndpointEntry[];
    readonly tags: readonly string[];
}

interface SpecInfo {
    readonly title?: string;
    readonly version?: string;
    readonly description?: string;
}

// ── Public API ───────────────────────────────────────────────

/**
 * Parse and summarize an OpenAPI/Swagger spec.
 *
 * Accepts JSON or YAML. Returns structured endpoint summary.
 */
export function summarizeSpec(raw: string): SpecSummary {
    const spec = parseSpec(raw);

    const info: SpecInfo = (spec.info as SpecInfo) ?? {};
    const title       = info.title ?? 'Untitled API';
    const version     = info.version ?? '';
    const description = info.description ?? '';
    const baseUrl     = extractBaseUrl(spec);
    const endpoints   = extractEndpoints(spec);
    const tags        = [...new Set(endpoints.map(e => e.tag))].sort();

    return { title, version, description, baseUrl, endpoints, tags };
}

// ── Internal ─────────────────────────────────────────────────

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head'] as const;

function parseSpec(raw: string): Record<string, unknown> {
    return raw.trimStart().startsWith('{')
        ? JSON.parse(raw)
        : YAML.parse(raw) as Record<string, unknown>;
}

function extractBaseUrl(spec: Record<string, unknown>): string {
    const servers = spec.servers as Array<{ url?: string }> | undefined;
    if (servers?.[0]?.url) return servers[0].url;

    const host     = spec.host as string | undefined;
    const basePath = spec.basePath as string | undefined;
    const schemes  = spec.schemes as string[] | undefined;

    if (host) {
        return `${schemes?.[0] ?? 'https'}://${host}${basePath ?? ''}`;
    }

    return '';
}

function extractEndpoints(spec: Record<string, unknown>): EndpointEntry[] {
    const paths = spec.paths as Record<string, Record<string, unknown>> | undefined;
    if (!paths) return [];

    const entries: EndpointEntry[] = [];

    for (const [path, methods] of Object.entries(paths)) {
        if (!methods || typeof methods !== 'object') continue;

        for (const method of HTTP_METHODS) {
            const op = methods[method] as Record<string, unknown> | undefined;
            if (!op) continue;

            entries.push({
                method:     method.toUpperCase(),
                path,
                summary:    ((op.summary as string) ?? (op.description as string) ?? '').slice(0, 200),
                tag:        ((op.tags as string[]) ?? ['default'])[0],
                parameters: formatParameters(op),
            });
        }
    }

    return entries;
}

function formatParameters(op: Record<string, unknown>): string {
    const params = op.parameters as Array<{ name?: string; in?: string; required?: boolean }> | undefined;
    if (!params?.length) return '';

    return params.map(p => `${p.name}${p.required ? '*' : ''} (${p.in})`).join(', ');
}
