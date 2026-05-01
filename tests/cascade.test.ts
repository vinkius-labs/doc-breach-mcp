/**
 * DocBreach MCP — Search Cascade Tests
 *
 * Tests the cascade orchestrator logic and engine interface.
 */
import { describe, it, expect } from 'vitest';
import type { SearchEngine, SearchResult } from '../src/engine/search/types.js';

// ── Mock Engines ─────────────────────────────────────────────

function createMockEngine(name: string, results: SearchResult[]): SearchEngine {
    return {
        name,
        search: async (_query: string, maxResults: number) =>
            results.slice(0, maxResults),
    };
}

function createFailingEngine(name: string): SearchEngine {
    return {
        name,
        search: async () => [],
    };
}

describe('SearchEngine interface', () => {
    it('should return results when available', async () => {
        const engine = createMockEngine('Test', [
            { url: 'https://example.com', title: 'Example', snippet: 'Test' },
        ]);

        const results = await engine.search('test', 10);
        expect(results).toHaveLength(1);
        expect(results[0].url).toBe('https://example.com');
    });

    it('should respect maxResults limit', async () => {
        const engine = createMockEngine('Test', [
            { url: 'https://a.com', title: 'A', snippet: '' },
            { url: 'https://b.com', title: 'B', snippet: '' },
            { url: 'https://c.com', title: 'C', snippet: '' },
        ]);

        const results = await engine.search('test', 2);
        expect(results).toHaveLength(2);
    });

    it('should return empty array on failure', async () => {
        const engine = createFailingEngine('Broken');
        const results = await engine.search('test', 10);
        expect(results).toHaveLength(0);
    });
});

describe('Cascade Logic', () => {
    async function cascade(engines: SearchEngine[], query: string, max: number): Promise<readonly SearchResult[]> {
        for (const engine of engines) {
            const results = await engine.search(query, max);
            if (results.length > 0) return results;
        }
        return [];
    }

    it('should return results from first successful engine', async () => {
        const engines = [
            createMockEngine('DDG', [
                { url: 'https://ddg.com', title: 'DDG Result', snippet: '' },
            ]),
            createMockEngine('Brave', [
                { url: 'https://brave.com', title: 'Brave Result', snippet: '' },
            ]),
        ];

        const results = await cascade(engines, 'test', 10);
        expect(results).toHaveLength(1);
        expect(results[0].url).toBe('https://ddg.com');
    });

    it('should fallback to second engine when first fails', async () => {
        const engines = [
            createFailingEngine('DDG'),
            createMockEngine('Brave', [
                { url: 'https://brave.com', title: 'Brave Result', snippet: '' },
            ]),
        ];

        const results = await cascade(engines, 'test', 10);
        expect(results).toHaveLength(1);
        expect(results[0].url).toBe('https://brave.com');
    });

    it('should return empty when all engines fail', async () => {
        const engines = [
            createFailingEngine('DDG'),
            createFailingEngine('Brave'),
        ];

        const results = await cascade(engines, 'test', 10);
        expect(results).toHaveLength(0);
    });
});
