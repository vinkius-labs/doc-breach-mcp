/**
 * DocBreach MCP - OpenAPI Parser Tests
 *
 * Covers public OpenAPI 3.1 specs with query parameters and API key auth.
 */
import { describe, expect, it } from 'vitest';

import { summarizeSpec } from '../src/engine/spec/openapi.js';
import { specToMarkdown } from '../src/engine/spec/markdown.js';

const XQUIK_SEARCH_SPEC = JSON.stringify({
    openapi: '3.1.0',
    info: {
        title: 'Xquik API',
        version: '2.4.8',
        description: 'REST API for X automation workflows.',
    },
    servers: [{ url: 'https://xquik.com' }],
    components: {
        securitySchemes: {
            apiKey: {
                type: 'apiKey',
                name: 'x-api-key',
                in: 'header',
            },
        },
    },
    paths: {
        '/api/v1/x/tweets/search': {
            get: {
                operationId: 'searchTweets',
                summary: 'Search X posts',
                tags: ['X'],
                security: [{ apiKey: [] }],
                parameters: [
                    {
                        name: 'q',
                        in: 'query',
                        required: true,
                        schema: { type: 'string' },
                    },
                    {
                        name: 'queryType',
                        in: 'query',
                        schema: {
                            type: 'string',
                            enum: ['Latest', 'Top'],
                            default: 'Latest',
                        },
                    },
                    {
                        name: 'limit',
                        in: 'query',
                        schema: {
                            type: 'integer',
                            minimum: 1,
                            maximum: 200,
                            default: 20,
                        },
                    },
                ],
                responses: {
                    200: { description: 'Search results' },
                },
            },
        },
    },
});

describe('OpenAPI Spec Summary', () => {
    it('summarizes an OpenAPI 3.1 search spec', () => {
        const summary = summarizeSpec(XQUIK_SEARCH_SPEC);

        expect(summary.title).toBe('Xquik API');
        expect(summary.version).toBe('2.4.8');
        expect(summary.baseUrl).toBe('https://xquik.com');
        expect(summary.tags).toEqual(['X']);
        expect(summary.endpoints).toHaveLength(1);

        const endpoint = summary.endpoints[0];
        expect(endpoint?.method).toBe('GET');
        expect(endpoint?.path).toBe('/api/v1/x/tweets/search');
        expect(endpoint?.summary).toBe('Search X posts');
        expect(endpoint?.parameters).toBe('q* (query), queryType (query), limit (query)');
    });

    it('renders endpoint parameters in markdown output', () => {
        const markdown = specToMarkdown(summarizeSpec(XQUIK_SEARCH_SPEC));

        expect(markdown).toContain('# Xquik API (v2.4.8)');
        expect(markdown).toContain('**Base URL:** `https://xquik.com`');
        expect(markdown).toContain('`GET /api/v1/x/tweets/search`');
        expect(markdown).toContain('Parameters: q* (query), queryType (query), limit (query)');
    });
});
