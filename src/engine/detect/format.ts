// ══════════════════════════════════════════════════════════════
// 💥 DocBreach MCP — Format Detection
//
// Detect the document format from URL, Content-Type, and body
// before routing to the correct processing pipeline.
// ══════════════════════════════════════════════════════════════

// ── Types ────────────────────────────────────────────────────

export type DocFormat =
    | 'openapi'
    | 'swagger'
    | 'postman'
    | 'llms_txt'
    | 'markdown'
    | 'pdf'
    | 'json'
    | 'yaml'
    | 'html'
    | 'plaintext';

// ── Detection Pipeline ───────────────────────────────────────

type FormatProbe = (url: string, ct: string, body: string) => DocFormat | null;

const PROBES: readonly FormatProbe[] = [
    probeUrlPatterns,
    probeContentType,
    probeBodySignature,
    probeFallback,
];

// ── Public API ───────────────────────────────────────────────

/**
 * Detect the documentation format.
 *
 * Probe chain: URL → Content-Type → body signature → fallback.
 */
export function detectFormat(url: string, contentType: string, body: string): DocFormat {
    const ct = contentType.toLowerCase();

    for (const probe of PROBES) {
        const result = probe(url, ct, body);
        if (result) return result;
    }

    return 'plaintext';
}

// ── Probes ───────────────────────────────────────────────────

function probeUrlPatterns(url: string, ct: string): DocFormat | null {
    const lower = url.toLowerCase();

    if (lower.endsWith('/llms.txt') || lower.endsWith('/llms-full.txt')) return 'llms_txt';
    if (lower.endsWith('.pdf') || ct.includes('application/pdf'))       return 'pdf';
    if (lower.endsWith('.md') || lower.endsWith('.markdown'))           return 'markdown';

    return null;
}

function probeContentType(_url: string, ct: string, body: string): DocFormat | null {
    if (ct.includes('application/json') || ct.includes('+json'))                                    return classifyJson(body);
    if (ct.includes('application/yaml') || ct.includes('text/yaml') || ct.includes('application/x-yaml')) return classifyYaml(body);
    if (ct.includes('text/markdown'))                                                                return 'markdown';
    if (ct.includes('text/plain'))                                                                   return classifyPlain(body);

    return null;
}

function probeBodySignature(_url: string, _ct: string, body: string): DocFormat | null {
    const head = body.trimStart();

    if (head.startsWith('{') || head.startsWith('['))  return classifyJson(body);
    if (head.startsWith('openapi:'))                   return 'openapi';
    if (head.startsWith('swagger:'))                   return 'swagger';

    if (/^#{1,6}\s/m.test(head.slice(0, 200))) {
        if (!head.includes('<html') && !head.includes('<!DOCTYPE')) return 'markdown';
    }

    return null;
}

function probeFallback(_url: string, ct: string, body: string): DocFormat | null {
    const head = body.trimStart();

    if (ct.includes('text/html') || head.includes('<html') || head.includes('<!DOCTYPE')) {
        return 'html';
    }

    return 'plaintext';
}

// ── Classifiers ──────────────────────────────────────────────

function classifyJson(body: string): DocFormat {
    try {
        const parsed = JSON.parse(body.slice(0, 10_000));

        if (typeof parsed.openapi === 'string')                     return 'openapi';
        if (typeof parsed.swagger === 'string')                     return 'swagger';
        if (parsed.info?.schema?.includes('schema.getpostman.com')) return 'postman';
        if (parsed.info?._postman_id)                               return 'postman';

        return 'json';
    } catch {
        return 'json';
    }
}

function classifyYaml(body: string): DocFormat {
    if (body.includes('openapi:')) return 'openapi';
    if (body.includes('swagger:')) return 'swagger';
    return 'yaml';
}

function classifyPlain(body: string): DocFormat {
    const head = body.trimStart();

    if (/^#\s/m.test(head) && /^>\s/m.test(head)) return 'llms_txt';
    if (/^#{1,6}\s/m.test(head))                   return 'markdown';

    return 'plaintext';
}
