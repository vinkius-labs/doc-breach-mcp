// ══════════════════════════════════════════════════════════════
// 💥 DocBreach MCP — Tool Registry Index
// Static imports for all tools — required for esbuild bundling
// (vurb validate / vurb deploy). At runtime, autoDiscover
// handles registration. This barrel ensures the bundler
// captures all tool definitions in the dependency graph.
// ══════════════════════════════════════════════════════════════

export { discover } from './discover.tool.js';
export { read } from './read.tool.js';
export { search } from './search.tool.js';
export { extract } from './extract.tool.js';
