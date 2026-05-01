// ══════════════════════════════════════════════════════════════
// 🪟 TACTICAL BYPASS: SOURCE CHASING
//
// Documentation sites embed API references inside iFrames —
// Swagger UI, Stoplight, Postman, Redoc. The parent page is
// useless scaffolding. The real spec lives in the iframe src.
// ══════════════════════════════════════════════════════════════

import * as cheerio from 'cheerio';
import { resolveUrl } from '../shared/utils.js';

// ── Types ────────────────────────────────────────────────────

export type EmbedPlatform =
    | 'swagger-ui'
    | 'redoc'
    | 'stoplight'
    | 'postman'
    | 'rapidoc'
    | 'unknown';

export interface EmbedResult {
    readonly detected: boolean;
    readonly platform: EmbedPlatform;
    readonly specUrl: string | null;
    readonly iframeSrc: string | null;
}

// ── Detector Registry ────────────────────────────────────────

interface EmbedDetector {
    readonly platform: EmbedPlatform;
    readonly detect: ($: cheerio.CheerioAPI) => string | null;
}

const DETECTORS: readonly EmbedDetector[] = [
    { platform: 'swagger-ui', detect: detectSwaggerUI },
    { platform: 'redoc',      detect: detectRedoc },
    { platform: 'stoplight',  detect: detectStoplight },
    { platform: 'postman',    detect: detectPostman },
    { platform: 'rapidoc',    detect: detectRapidoc },
];

// ── Public API ───────────────────────────────────────────────

/**
 * Detect embedded API documentation viewers in an HTML page.
 *
 * Returns the spec URL if found, so the reader can fetch
 * the raw spec instead of the rendered wrapper.
 */
export function detectEmbed(html: string, baseUrl: string): EmbedResult {
    const $ = cheerio.load(html);

    for (const { platform, detect } of DETECTORS) {
        const specUrl = detect($);
        if (specUrl) {
            return { detected: true, platform, specUrl: resolveUrl(specUrl, baseUrl), iframeSrc: null };
        }
    }

    const iframeSrc = detectIframeEmbed($);
    if (iframeSrc) {
        return { detected: true, platform: classifyIframeSrc(iframeSrc), specUrl: null, iframeSrc: resolveUrl(iframeSrc, baseUrl) };
    }

    return { detected: false, platform: 'unknown', specUrl: null, iframeSrc: null };
}

// ── Platform Detectors ───────────────────────────────────────

function detectSwaggerUI($: cheerio.CheerioAPI): string | null {
    const configMatch = $.html().match(/SwaggerUIBundle\s*\(\s*\{[\s\S]*?url\s*:\s*["']([^"']+)["']/);
    if (configMatch) return configMatch[1];
    return $('#swagger-ui').attr('data-url') ?? $('[data-swagger-url]').attr('data-swagger-url') ?? null;
}

function detectRedoc($: cheerio.CheerioAPI): string | null {
    const el = $('redoc');
    if (el.length) return el.attr('spec-url') ?? null;
    const match = $.html().match(/Redoc\.init\s*\(\s*["']([^"']+)["']/);
    return match?.[1] ?? null;
}

function detectStoplight($: cheerio.CheerioAPI): string | null {
    const el = $('elements-api');
    return el.attr('apidescriptionurl') ?? el.attr('apiDescriptionUrl') ?? null;
}

function detectPostman($: cheerio.CheerioAPI): string | null {
    return $('[data-postman-action]').attr('data-postman-action') ?? null;
}

function detectRapidoc($: cheerio.CheerioAPI): string | null {
    return $('rapi-doc').attr('spec-url') ?? null;
}

// ── iFrame Detection ─────────────────────────────────────────

const EMBED_DOMAINS: readonly string[] = [
    'petstore.swagger.io', 'app.swaggerhub.com',
    'stoplight.io', 'redocly.com', 'documenter.getpostman.com',
];

function detectIframeEmbed($: cheerio.CheerioAPI): string | null {
    for (const el of $('iframe').toArray()) {
        const src = $(el).attr('src');
        if (src && EMBED_DOMAINS.some(d => src.includes(d))) return src;
    }
    return null;
}

function classifyIframeSrc(src: string): EmbedPlatform {
    if (src.includes('swagger'))   return 'swagger-ui';
    if (src.includes('redoc'))     return 'redoc';
    if (src.includes('stoplight')) return 'stoplight';
    if (src.includes('postman'))   return 'postman';
    return 'unknown';
}
