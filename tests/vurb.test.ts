/**
 * DocBreach MCP — Vurb Instance Tests
 *
 * Validates the typed initVurb<DocsContext> factory and context shape.
 */
import { describe, it, expect } from 'vitest';
import { f, type DocsContext } from '../src/vurb.js';

describe('Vurb Instance', () => {
    it('should export a valid Vurb factory', () => {
        expect(f).toBeDefined();
        expect(typeof f.query).toBe('function');
        expect(typeof f.action).toBe('function');
        expect(typeof f.router).toBe('function');
        expect(typeof f.registry).toBe('function');
    });

    it('should create a ToolRegistry', () => {
        const registry = f.registry();
        expect(registry).toBeDefined();
        expect(typeof registry.register).toBe('function');
        expect(typeof registry.getBuilders).toBe('function');
    });

    it('should expose typed context interface', () => {
        // Compile-time check — if DocsContext changes shape, this breaks
        const ctx: DocsContext = {
            cache: new Map(),
            requestCount: 0,
        };

        expect(ctx.cache).toBeInstanceOf(Map);
        expect(ctx.requestCount).toBe(0);
    });
});
