/**
 * DocBreach MCP — DDG Search Engine Tests
 *
 * Unit tests for the DuckDuckGo Lite HTML parser.
 * Uses fixture HTML to test without network calls.
 */
import { describe, it, expect } from 'vitest';

// We need to test the parser logic directly.
// Since DDG engine is self-contained, we test the exported engine's behavior.
// For unit-level parser testing, we replicate the key parsing logic.

import { stripHtml } from '../src/engine/shared/utils.js';

describe('DDG Parser — Link Extraction', () => {
    const LINK_RE = /<a[^>]*class=['"]\s*result-link\s*['"][^>]*href=['"]([^'"]+)['"][^>]*>([\s\S]*?)<\/a>|<a[^>]*href=['"]([^'"]+)['"][^>]*class=['"]\s*result-link\s*['"][^>]*>([\s\S]*?)<\/a>/gi;

    it('should extract result-link with class before href', () => {
        const html = '<a class="result-link" href="https://docs.stripe.com">Stripe Docs</a>';
        const matches = [...html.matchAll(new RegExp(LINK_RE.source, LINK_RE.flags))];

        expect(matches).toHaveLength(1);
        expect(matches[0][1]).toBe('https://docs.stripe.com');
        expect(stripHtml(matches[0][2])).toBe('Stripe Docs');
    });

    it('should extract result-link with href before class', () => {
        const html = '<a href="https://docs.stripe.com" class="result-link">Stripe Docs</a>';
        const matches = [...html.matchAll(new RegExp(LINK_RE.source, LINK_RE.flags))];

        expect(matches).toHaveLength(1);
        expect(matches[0][3]).toBe('https://docs.stripe.com');
    });

    it('should handle single and double quotes', () => {
        const html1 = `<a class='result-link' href='https://a.com'>A</a>`;
        const html2 = `<a class="result-link" href="https://b.com">B</a>`;

        const m1 = [...html1.matchAll(new RegExp(LINK_RE.source, LINK_RE.flags))];
        const m2 = [...html2.matchAll(new RegExp(LINK_RE.source, LINK_RE.flags))];

        expect(m1).toHaveLength(1);
        expect(m2).toHaveLength(1);
    });

    it('should extract multiple results from full HTML', () => {
        const html = `
            <a class="result-link" href="https://docs.stripe.com/api">Stripe API</a>
            <td class="result-snippet">Payment processing platform</td>
            <a class="result-link" href="https://docs.twilio.com">Twilio Docs</a>
            <td class="result-snippet">Communication API</td>
        `;

        const matches = [...html.matchAll(new RegExp(LINK_RE.source, LINK_RE.flags))];
        expect(matches).toHaveLength(2);
    });
});

describe('DDG Parser — Redirect URL Decoding', () => {
    function decodeRedirect(ddgUrl: string): string {
        const match = ddgUrl.match(/[?&]uddg=([^&]+)/);
        if (match) return decodeURIComponent(match[1]);
        if (ddgUrl.startsWith('http')) return ddgUrl;
        if (ddgUrl.startsWith('//')) return `https:${ddgUrl}`;
        return ddgUrl;
    }

    it('should decode DDG redirect URLs', () => {
        const encoded = '//duckduckgo.com/l/?uddg=https%3A%2F%2Fdocs.stripe.com%2Fapi&rut=abc';
        expect(decodeRedirect(encoded)).toBe('https://docs.stripe.com/api');
    });

    it('should pass through direct URLs', () => {
        expect(decodeRedirect('https://docs.stripe.com')).toBe('https://docs.stripe.com');
    });

    it('should handle protocol-relative URLs', () => {
        expect(decodeRedirect('//example.com/docs')).toBe('https://example.com/docs');
    });
});

describe('DDG Parser — Snippet Extraction', () => {
    const SNIPPET_RE = /<td[^>]*class=['"]\s*result-snippet\s*['"][^>]*>([\s\S]*?)<\/td>/gi;

    it('should extract snippet text', () => {
        const html = '<td class="result-snippet">This is a <b>snippet</b> about APIs</td>';
        const matches = [...html.matchAll(new RegExp(SNIPPET_RE.source, SNIPPET_RE.flags))];

        expect(matches).toHaveLength(1);
        expect(stripHtml(matches[0][1]).trim()).toBe('This is a snippet about APIs');
    });
});
