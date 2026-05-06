// ══════════════════════════════════════════════════════════════
// 💥 DocBreach MCP — Engine Public API
//
// Single import point for the entire engine layer.
// Tool handlers import from here — never from deep paths.
//
// import { fetchUrl, detectFormat, cleanHtml } from '../engine/index.js';
// ══════════════════════════════════════════════════════════════

// ── Shared ───────────────────────────────────────────────────
export { DocCache } from './shared/index.js';

// ── Fetch ────────────────────────────────────────────────────
export { fetchUrl, preflight } from './fetch/index.js';
export type { FetchResult, PreflightResult } from './fetch/index.js';
export { renderWithBrowser, closeBrowser } from './fetch/headless.js';

// ── Detect ───────────────────────────────────────────────────
export { detectFormat, detectLoginWall, detectEmbed } from './detect/index.js';
export type { DocFormat, LoginWallResult, EmbedResult, EmbedPlatform } from './detect/index.js';

// ── Transform ────────────────────────────────────────────────
export { cleanHtml, extractTitle, extractSPAContent, isEmptySPA, extractNavLinks, truncate } from './transform/index.js';
export type { HydrationResult, NavLink, TruncationResult } from './transform/index.js';

// ── Resolve ──────────────────────────────────────────────────
export { resolveGitHubUrl, isGitHubUrl } from './resolve/index.js';
export type { ResolvedGitHubUrl } from './resolve/index.js';

// ── Spec ─────────────────────────────────────────────────────
export { summarizeSpec, specToMarkdown, filterEndpoints } from './spec/index.js';
export type { EndpointEntry, SpecSummary, EndpointFilters } from './spec/index.js';

// ── Search ───────────────────────────────────────────────────
export { searchDDG } from './search/index.js';
export type { SearchResult } from './search/index.js';

// ── Map ──────────────────────────────────────────────────────
export { mapDocs } from './map/index.js';
export type { SiteMapEntry, SiteMapResult } from './map/index.js';
