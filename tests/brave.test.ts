/**
 * DocBreach MCP — Brave Search Parser Tests
 *
 * Unit tests for the Brave Search HTML result extraction.
 */
import { describe, it, expect } from 'vitest';
import { stripHtml } from '../src/engine/shared/utils.js';

describe('Brave Parser — Fallback Link Extraction', () => {
    const NOISE_DOMAINS = [
        'brave.com', 'brave.software', 'jsdelivr', 'gstatic',
        'google.com', 'googleapis.com', 'youtube.com', 'youtu.be',
        'facebook.com', 'twitter.com', 'x.com',
        'imgs.search.brave', 'favicons.search.brave',
    ];

    function isOrganic(url: string): boolean {
        if (!url.startsWith('http')) return false;
        return !NOISE_DOMAINS.some(d => url.includes(d));
    }

    it('should filter out noise domains', () => {
        expect(isOrganic('https://www.youtube.com/watch?v=123')).toBe(false);
        expect(isOrganic('https://google.com/search')).toBe(false);
        expect(isOrganic('https://imgs.search.brave.com/icon.png')).toBe(false);
        expect(isOrganic('https://search.brave.com/search')).toBe(false);
    });

    it('should keep organic documentation URLs', () => {
        expect(isOrganic('https://docs.stripe.com/api')).toBe(true);
        expect(isOrganic('https://developers.booking.com/')).toBe(true);
        expect(isOrganic('https://www.twilio.com/docs')).toBe(true);
    });

    it('should reject non-http URLs', () => {
        expect(isOrganic('javascript:void(0)')).toBe(false);
        expect(isOrganic('mailto:test@test.com')).toBe(false);
        expect(isOrganic('/relative/path')).toBe(false);
    });
});

describe('Brave Parser — Title Extraction from URL', () => {
    function extractDomainTitle(url: string): string {
        try {
            const { hostname, pathname } = new URL(url);
            const domain = hostname.replace('www.', '');
            const path = pathname.replace(/\/$/, '').split('/').pop() ?? '';
            const label = path.replace(/[-_]/g, ' ').replace(/\.\w+$/, '').trim();
            return label ? `${domain} — ${label}` : domain;
        } catch {
            return url;
        }
    }

    it('should extract domain and path segment', () => {
        expect(extractDomainTitle('https://docs.stripe.com/api/authentication'))
            .toBe('docs.stripe.com — authentication');
    });

    it('should handle root URLs', () => {
        expect(extractDomainTitle('https://docs.stripe.com/'))
            .toBe('docs.stripe.com');
    });

    it('should convert dashes and underscores to spaces', () => {
        expect(extractDomainTitle('https://example.com/getting-started'))
            .toBe('example.com — getting started');
    });

    it('should strip www prefix', () => {
        expect(extractDomainTitle('https://www.twilio.com/docs'))
            .toBe('twilio.com — docs');
    });
});

describe('Brave Parser — Structured Extraction', () => {
    const TITLE_LINK_RE = /class="snippet-title[^"]*"[^>]*>\s*<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i;
    const DESCRIPTION_RE = /class="snippet-description[^"]*"[^>]*>([\s\S]*?)<\/div>/i;

    it('should extract title link from snippet block', () => {
        const block = `
            <div class="snippet-title">
                <a href="https://docs.stripe.com/api">Stripe API Documentation</a>
            </div>
            <div class="snippet-description">Complete API reference for Stripe</div>
        `;

        const titleMatch = block.match(TITLE_LINK_RE);
        expect(titleMatch).toBeTruthy();
        expect(titleMatch![1]).toBe('https://docs.stripe.com/api');
        expect(stripHtml(titleMatch![2]).trim()).toBe('Stripe API Documentation');
    });

    it('should extract description from snippet block', () => {
        const block = `<div class="snippet-description">Complete <b>API</b> reference for Stripe</div>`;
        const descMatch = block.match(DESCRIPTION_RE);

        expect(descMatch).toBeTruthy();
        expect(stripHtml(descMatch![1]).trim()).toBe('Complete API reference for Stripe');
    });
});
