import { initVurb } from '@vurb/core';

export interface DocsContext {
    cache: Map<string, { content: string; fetchedAt: number }>;
    requestCount: number;
}

export const f = initVurb<DocsContext>();
