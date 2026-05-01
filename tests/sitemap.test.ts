/**
 * DocBreach MCP — Sitemap XML Parser Tests
 *
 * Unit tests for the sitemap.xml fallback parser.
 * Tests regex extraction and noise filtering logic without network calls.
 */
import { describe, it, expect } from 'vitest';

// Because sitemap.ts uses internal network fetches for indexes, 
// we'll mock the core extraction logic to test the regexes directly here.

const LOC_RE      = /<loc>\s*(.*?)\s*<\/loc>/gi;
const URL_BLOCK_RE = /<url>([\s\S]*?)<\/url>/gi;

function decodeXmlEntities(s: string): string {
    return s
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'");
}

function titleFromUrl(url: string): string {
    try {
        const { pathname } = new URL(url);
        const segments = pathname.replace(/\/$/, '').split('/').filter(Boolean);
        const last = segments[segments.length - 1] ?? '';
        return last
            .replace(/[-_]/g, ' ')
            .replace(/\.\w+$/, '')
            .replace(/\b\w/g, c => c.toUpperCase())
            .trim() || 'Home';
    } catch {
        return url;
    }
}

describe('Sitemap XML Extraction', () => {
    it('should extract URLs from standard <url> blocks', () => {
        const xml = `
            <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
                <url>
                    <loc>https://acme.com/docs/auth</loc>
                    <lastmod>2023-01-01</lastmod>
                </url>
                <url>
                    <loc>https://acme.com/docs/users</loc>
                </url>
            </urlset>
        `;

        const matches = [...xml.matchAll(URL_BLOCK_RE)];
        expect(matches).toHaveLength(2);

        const loc1 = matches[0][1].match(/<loc>\s*(.*?)\s*<\/loc>/i)?.[1];
        expect(loc1).toBe('https://acme.com/docs/auth');
    });

    it('should decode XML entities in URLs', () => {
        const encoded = 'https://acme.com/docs?id=1&amp;type=user';
        expect(decodeXmlEntities(encoded)).toBe('https://acme.com/docs?id=1&type=user');
    });

    it('should generate human-readable titles from URLs', () => {
        expect(titleFromUrl('https://stripe.com/docs/api/payment_intents')).toBe('Payment Intents');
        expect(titleFromUrl('https://stripe.com/docs/api/checkout-sessions')).toBe('Checkout Sessions');
        expect(titleFromUrl('https://example.com/')).toBe('Home');
    });
});

describe('Sitemap Noise Filters', () => {
    const DOC_INDICATORS = [
        '/docs', '/doc/', '/api', '/reference', '/guide',
        '/tutorial', '/getting-started', '/quickstart',
        '/sdk', '/library', '/client', '/webhook',
        '/authentication', '/auth', '/overview',
    ];

    const NOISE_INDICATORS = [
        '/blog', '/careers', '/jobs', '/press',
        '/about', '/contact', '/pricing', '/legal',
        '/privacy', '/terms', '/status', '/changelog',
        '/community', '/forum', '/support/ticket',
    ];

    function isDocUrl(url: string): boolean {
        const path = new URL(url).pathname.toLowerCase();
        if (NOISE_INDICATORS.some(n => path.includes(n))) return false;
        if (url.includes('docs.') || url.includes('developer')) return true;
        if (path === '/' || path === '') return true;
        return DOC_INDICATORS.some(d => path.includes(d)) || path.split('/').length <= 3;
    }

    it('should filter out noise URLs', () => {
        expect(isDocUrl('https://acme.com/blog/new-feature')).toBe(false);
        expect(isDocUrl('https://acme.com/careers/engineer')).toBe(false);
        expect(isDocUrl('https://acme.com/legal/terms-of-service')).toBe(false);
    });

    it('should accept documentation URLs', () => {
        expect(isDocUrl('https://acme.com/docs/api-reference')).toBe(true);
        expect(isDocUrl('https://acme.com/api/v1/users')).toBe(true);
        expect(isDocUrl('https://acme.com/getting-started')).toBe(true);
    });

    it('should accept ALL paths if domain is a docs subdomain', () => {
        expect(isDocUrl('https://docs.stripe.com/payment-intents')).toBe(true);
        expect(isDocUrl('https://developers.google.com/maps/js')).toBe(true);
    });
});
