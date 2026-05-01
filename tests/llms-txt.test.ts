/**
 * DocBreach MCP — llms.txt Parser Tests
 *
 * Unit tests for the llms.txt format parser.
 * Tests real-world formats from the llmstxt.org spec.
 */
import { describe, it, expect } from 'vitest';
import { parseLlmsTxt } from '../src/engine/map/llms-txt.js';

describe('parseLlmsTxt', () => {
    it('should extract title from # heading', () => {
        const result = parseLlmsTxt('# Stripe API\n> Payment platform');
        expect(result.title).toBe('Stripe API');
    });

    it('should extract description from > blockquote', () => {
        const result = parseLlmsTxt('# Stripe\n> Payment processing platform for developers');
        expect(result.description).toBe('Payment processing platform for developers');
    });

    it('should parse links with descriptions in sections', () => {
        const content = `# Acme API
> The best API ever

## Getting Started
- [Authentication](https://acme.com/docs/auth): How to authenticate
- [Quickstart](https://acme.com/docs/quickstart): Get started in 5 min

## Endpoints
- [Users API](https://acme.com/docs/users): Manage users
- [Billing API](https://acme.com/docs/billing): Manage invoices
`;

        const result = parseLlmsTxt(content);

        expect(result.title).toBe('Acme API');
        expect(result.description).toBe('The best API ever');
        expect(result.entries).toHaveLength(4);

        expect(result.entries[0]).toMatchObject({
            url: 'https://acme.com/docs/auth',
            title: 'Authentication',
            description: 'How to authenticate',
            section: 'Getting Started',
            source: 'llms_txt',
        });

        expect(result.entries[2]).toMatchObject({
            url: 'https://acme.com/docs/users',
            title: 'Users API',
            section: 'Endpoints',
        });
    });

    it('should parse links without sections as top-level', () => {
        const content = `# Simple API
- [Docs](https://example.com/docs): Main docs
- [Auth](https://example.com/auth): Auth page
`;
        const result = parseLlmsTxt(content);

        expect(result.entries).toHaveLength(2);
        expect(result.entries[0].section).toBe('Documentation');
    });

    it('should parse links without descriptions', () => {
        const content = `# API
## Reference
- [GET /users](https://api.example.com/users)
`;
        const result = parseLlmsTxt(content);

        expect(result.entries).toHaveLength(1);
        expect(result.entries[0].description).toBe('');
        expect(result.entries[0].title).toBe('GET /users');
    });

    it('should return empty entries for content without links', () => {
        const result = parseLlmsTxt('# Just a title\n\nSome text but no links.');
        expect(result.entries).toHaveLength(0);
        expect(result.title).toBe('Just a title');
    });

    it('should handle empty input', () => {
        const result = parseLlmsTxt('');
        expect(result.title).toBe('');
        expect(result.description).toBe('');
        expect(result.entries).toHaveLength(0);
    });

    it('should preserve raw content', () => {
        const content = '# Test\n> Desc\n\n## Section\n- [Link](https://x.com): D';
        const result = parseLlmsTxt(content);
        expect(result.raw).toBe(content);
    });

    it('should handle multiple sections correctly', () => {
        const content = `# Multi Section API

## Auth
- [OAuth](https://api.com/oauth): OAuth flow
- [API Keys](https://api.com/keys): Key management

## REST
- [Users](https://api.com/users): User endpoints

## Webhooks
- [Events](https://api.com/events): Event types
- [Setup](https://api.com/webhook-setup): Configure webhooks
`;
        const result = parseLlmsTxt(content);

        expect(result.entries).toHaveLength(5);

        const authEntries = result.entries.filter(e => e.section === 'Auth');
        const restEntries = result.entries.filter(e => e.section === 'REST');
        const webhookEntries = result.entries.filter(e => e.section === 'Webhooks');

        expect(authEntries).toHaveLength(2);
        expect(restEntries).toHaveLength(1);
        expect(webhookEntries).toHaveLength(2);
    });
});
