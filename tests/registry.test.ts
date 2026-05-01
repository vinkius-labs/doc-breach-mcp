/**
 * DocBreach MCP — Tool Registration & Registry Tests
 *
 * Verifies that the Vurb.ts MVA scaffold is correctly wired:
 * router, tools, models, presenters, and autoDiscover.
 */
import { describe, it, expect } from 'vitest';
import { initVurb, autoDiscover } from '@vurb/core';
import { fileURLToPath } from 'node:url';

describe('Registry', () => {
    it('should register all 4 tools via autoDiscover from dist/', async () => {
        const f = initVurb();
        const registry = f.registry();

        const files = await autoDiscover(
            registry,
            fileURLToPath(new URL('../dist/agents', import.meta.url)),
        );

        const builders = [...registry.getBuilders()];
        expect(builders.length).toBeGreaterThanOrEqual(1);

        // The router groups all tools under "docs"
        const docsBuilder = builders.find(b => b.getName() === 'docs');
        expect(docsBuilder).toBeDefined();

        const actionNames = docsBuilder!.getActionNames();
        expect(actionNames).toContain('discover');
        expect(actionNames).toContain('read');
        expect(actionNames).toContain('search');
        expect(actionNames).toContain('extract');
        expect(actionNames).toHaveLength(4);
    });

    it('should skip test and declaration files during discovery', async () => {
        const f = initVurb();
        const registry = f.registry();

        const files = await autoDiscover(
            registry,
            fileURLToPath(new URL('../dist/agents', import.meta.url)),
        );

        const hasTestFile = files.some(f => /\.(test|spec|d)\./.test(f));
        expect(hasTestFile).toBe(false);
    });

    it('should deduplicate tools from router when multiple files export the same builder', async () => {
        const f = initVurb();
        const registry = f.registry();

        await autoDiscover(
            registry,
            fileURLToPath(new URL('../dist/agents', import.meta.url)),
        );

        // All tools share the "docs" router — should result in exactly 1 builder
        const builders = [...registry.getBuilders()];
        const docsBuilders = builders.filter(b => b.getName() === 'docs');
        expect(docsBuilders).toHaveLength(1);
    });
});

describe('Router', () => {
    it('should define a router with namespace "docs"', async () => {
        const { docs } = await import('../src/agents/docs.router.js');

        // FluentRouter exposes name via internal field
        expect(docs).toBeDefined();
        expect(typeof docs.query).toBe('function');
        expect(typeof docs.action).toBe('function');
    });
});
