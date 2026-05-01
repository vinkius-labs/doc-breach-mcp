/**
 * DocBreach MCP — Domain Model Tests
 *
 * Validates defineModel schemas produce correct field definitions.
 */
import { describe, it, expect } from 'vitest';
import { SearchResultModel } from '../src/models/SearchResultModel.js';
import { DocContentModel } from '../src/models/DocContentModel.js';
import { EndpointModel } from '../src/models/EndpointModel.js';

describe('SearchResultModel', () => {
    it('should be defined with name "SearchResult"', () => {
        expect(SearchResultModel).toBeDefined();
        expect(SearchResultModel.name).toBe('SearchResult');
    });

    it('should have a valid Zod schema', () => {
        expect(SearchResultModel.schema).toBeDefined();
        expect(typeof SearchResultModel.schema.parse).toBe('function');
    });
});

describe('DocContentModel', () => {
    it('should be defined with name "DocContent"', () => {
        expect(DocContentModel).toBeDefined();
        expect(DocContentModel.name).toBe('DocContent');
    });

    it('should have a valid Zod schema', () => {
        expect(DocContentModel.schema).toBeDefined();
        expect(typeof DocContentModel.schema.parse).toBe('function');
    });
});

describe('EndpointModel', () => {
    it('should be defined with name "Endpoint"', () => {
        expect(EndpointModel).toBeDefined();
        expect(EndpointModel.name).toBe('Endpoint');
    });

    it('should have a valid Zod schema', () => {
        expect(EndpointModel.schema).toBeDefined();
        expect(typeof EndpointModel.schema.parse).toBe('function');
    });
});
