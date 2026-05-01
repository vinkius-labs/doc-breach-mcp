/**
 * DocBreach MCP — Presenter Tests
 *
 * Validates Presenters are correctly defined with schemas,
 * agent limits, and HATEOAS-style suggested actions.
 */
import { describe, it, expect } from 'vitest';
import { SourcePresenter } from '../src/views/source.presenter.js';
import { ContentPresenter } from '../src/views/content.presenter.js';
import { EndpointPresenter } from '../src/views/endpoint.presenter.js';

// definePresenter returns objects with underscore-prefixed internal fields
type PresenterInternal = {
    __brand: string;
    name: string;
    _schema: unknown;
    _agentLimit?: { max: number };
    _suggestActions?: (data: unknown) => unknown[];
    _rules?: unknown[];
};

describe('SourcePresenter', () => {
    const p = SourcePresenter as unknown as PresenterInternal;

    it('should be branded as VurbPresenter', () => {
        expect(p.__brand).toBe('VurbPresenter');
    });

    it('should be defined with name "DocSources"', () => {
        expect(p.name).toBe('DocSources');
    });

    it('should have a Zod schema bound', () => {
        expect(p._schema).toBeDefined();
    });

    it('should enforce agent limit of 10 results', () => {
        expect(p._agentLimit?.max).toBe(10);
    });

    it('should suggest docs.read as a follow-up action', () => {
        const actions = p._suggestActions?.({
            url: 'https://docs.example.com/api',
            title: 'Example API',
        }) as { tool: string; args: Record<string, string> }[] | undefined;

        expect(actions).toBeDefined();
        expect(actions!.length).toBeGreaterThanOrEqual(1);
        expect(actions![0].tool).toBe('docs.read');
        expect(actions![0].args.url).toBe('https://docs.example.com/api');
    });
});

describe('ContentPresenter', () => {
    const p = ContentPresenter as unknown as PresenterInternal;

    it('should be branded as VurbPresenter', () => {
        expect(p.__brand).toBe('VurbPresenter');
    });

    it('should be defined with name "DocContent"', () => {
        expect(p.name).toBe('DocContent');
    });

    it('should enforce agent limit of 1 result', () => {
        expect(p._agentLimit?.max).toBe(1);
    });

    it('should suggest docs.read when nav_links are present', () => {
        const actions = p._suggestActions?.({
            url: 'https://api.example.com/docs',
            format: 'openapi',
            nav_links: [{ title: 'Auth', url: 'https://api.example.com/auth' }],
        }) as { tool: string }[] | undefined;

        expect(actions).toBeDefined();
        expect(actions!.length).toBeGreaterThanOrEqual(1);
        expect(actions![0].tool).toBe('docs.read');
    });

    it('should return empty actions when no nav_links or truncation', () => {
        const actions = p._suggestActions?.({
            url: 'https://api.example.com/docs',
            format: 'html',
        }) as { tool: string }[] | undefined;

        expect(actions).toBeDefined();
        expect(actions!.length).toBe(0);
    });
});

describe('EndpointPresenter', () => {
    const p = EndpointPresenter as unknown as PresenterInternal;

    it('should be branded as VurbPresenter', () => {
        expect(p.__brand).toBe('VurbPresenter');
    });

    it('should be defined with name "Endpoints"', () => {
        expect(p.name).toBe('Endpoints');
    });

    it('should enforce agent limit of 30 results', () => {
        expect(p._agentLimit?.max).toBe(30);
    });
});
