/**
 * DocBreach MCP — Nav Link Extractor Tests
 *
 * Unit tests for the Cheerio-based navigation scraper.
 */
import { describe, it, expect } from 'vitest';
import { extractNavLinks } from '../src/engine/transform/nav.js';

describe('extractNavLinks', () => {
    it('should extract absolute URLs from navigation sidebars', () => {
        const html = `
            <html>
                <body>
                    <div class="docs-sidebar">
                        <a href="/getting-started">Getting Started</a>
                        <a href="/auth">Authentication</a>
                    </div>
                </body>
            </html>
        `;

        const links = extractNavLinks(html, 'https://example.com');
        
        expect(links).toHaveLength(2);
        expect(links[0].title).toBe('Getting Started');
        expect(links[0].url).toBe('https://example.com/getting-started');
        expect(links[1].url).toBe('https://example.com/auth');
    });

    it('should deduplicate URLs', () => {
        const html = `
            <aside>
                <a href="/docs/api">API Reference</a>
            </aside>
            <nav>
                <a href="https://example.com/docs/api">API Reference</a>
            </nav>
        `;

        const links = extractNavLinks(html, 'https://example.com');
        expect(links).toHaveLength(1);
        expect(links[0].url).toBe('https://example.com/docs/api');
    });

    it('should filter out noise patterns', () => {
        const html = `
            <nav>
                <a href="/docs/valid">Valid Link</a>
                <a href="#hash-link">Hash Link</a>
                <a href="javascript:void(0)">JS Link</a>
                <a href="mailto:test@test.com">Mailto</a>
                <a href="/assets/logo.png">Image</a>
                <a href="/login">Login</a>
            </nav>
        `;

        const links = extractNavLinks(html, 'https://example.com');
        expect(links).toHaveLength(1);
        expect(links[0].url).toBe('https://example.com/docs/valid');
    });

    it('should extract from multiple selector types', () => {
        const html = `
            <div>
                <nav><a href="/1">One</a></nav>
                <aside><a href="/2">Two</a></aside>
                <div class="table-of-contents"><a href="/3">Three</a></div>
                <div role="navigation"><a href="/4">Four</a></div>
            </div>
        `;

        const links = extractNavLinks(html, 'https://example.com');
        expect(links).toHaveLength(4);
    });

    it('should ignore links with empty or 1-character text', () => {
        const html = `
            <nav>
                <a href="/docs/1"></a>
                <a href="/docs/2">A</a>
                <a href="/docs/3">OK</a>
            </nav>
        `;

        const links = extractNavLinks(html, 'https://example.com');
        expect(links).toHaveLength(1);
        expect(links[0].title).toBe('OK');
    });
});
