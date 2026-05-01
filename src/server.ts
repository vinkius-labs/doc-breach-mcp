#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════
// 💥 DocBreach MCP — Server Bootstrap
// One command. STDIO. No config. No API keys.
// The crowbar boots in under 200ms.
// ══════════════════════════════════════════════════════════════

import { fileURLToPath } from 'node:url';
import { autoDiscover, startServer } from '@vurb/core';
import { f } from './vurb.js';

// ── Registry ─────────────────────────────────────────────
// autoDiscover scans ./agents relative to this compiled file.
// Drop a .tool.ts in agents/ → it becomes a tool. Zero boilerplate.
export const registry = f.registry();
await autoDiscover(registry, fileURLToPath(new URL('./agents', import.meta.url)));

// ── Boot ─────────────────────────────────────────────────
async function main() {
    await startServer({
        name: 'doc-breach-mcp',
        version: '0.1.0',
        registry,
        contextFactory: () => ({
            cache: new Map(),
            requestCount: 0,
        }),
    });
}

main().catch(console.error);
