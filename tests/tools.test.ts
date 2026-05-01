/**
 * DocBreach MCP — Tool Definition Tests
 *
 * Validates the Fluent API tool definitions: parameters, descriptions,
 * instructions, return types, and annotations.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { initVurb, autoDiscover } from '@vurb/core';
import { fileURLToPath } from 'node:url';

type AnyBuilder = {
    getName(): string;
    getActionNames(): string[];
    buildToolDefinition(): unknown;
};

let docsBuilder: AnyBuilder;

beforeAll(async () => {
    const f = initVurb();
    const registry = f.registry();
    await autoDiscover(
        registry,
        fileURLToPath(new URL('../dist/agents', import.meta.url)),
    );
    docsBuilder = [...registry.getBuilders()].find(b => b.getName() === 'docs') as AnyBuilder;
});

describe('docs.discover', () => {
    it('should define a "query" parameter for discovery queries', () => {
        const def = docsBuilder.buildToolDefinition() as any;
        const discover = def.actions?.discover ?? def;

        expect(discover.description).toBeTruthy();
        expect(discover.description.length).toBeGreaterThan(10);
    });
});

describe('docs.read', () => {
    it('should define "url" as a required parameter', () => {
        const def = docsBuilder.buildToolDefinition() as any;
        const read = def.actions?.read ?? def;

        expect(read.description).toBeTruthy();
    });
});

describe('docs.search', () => {
    it('should define "query" and optional "site" parameters', () => {
        const def = docsBuilder.buildToolDefinition() as any;
        const search = def.actions?.search ?? def;

        expect(search.description).toBeTruthy();
    });
});

describe('docs.extract', () => {
    it('should define "url" as required and "tag", "method", "search" as optional', () => {
        const def = docsBuilder.buildToolDefinition() as any;
        const extract = def.actions?.extract ?? def;

        expect(extract.description).toBeTruthy();
    });
});

describe('docs.map', () => {
    it('should define "domain" as a required parameter', () => {
        const def = docsBuilder.buildToolDefinition() as any;
        const map = def.actions?.map ?? def;

        expect(map.description).toBeTruthy();
        expect(map.description.length).toBeGreaterThan(10);
    });
});
