// ══════════════════════════════════════════════════════════════
// 💥 DocBreach MCP — docs.read
// 🛡️ TACTICAL ROLE: THE BREACHER
//
// The 11-step pipeline. Fetch, detect, bypass, clean, convert.
// This is where Cloudflare walls crumble and SPAs get hijacked.
//
// Step 1:  GitHub URL resolution (blob → raw)
// Step 2:  Fetch (GET + Wayback fallback on 403/503)
// Step 3:  Login wall detection
// Step 4:  Format detection (OpenAPI, Postman, PDF, llms_txt, Markdown)
// Step 5:  Spec summarization (OpenAPI/Swagger → Markdown)
// Step 6:  SPA hydration (__NEXT_DATA__, __NUXT__, readme-data)
// Step 7:  iFrame detection (Swagger/Stoplight/Redoc embeds)
// Step 8:  HTML cleaning (Cheerio noise removal)
// Step 9:  Title extraction
// Step 10: Nav extraction (sidebar links + URL resolution)
// Step 11: Markdown conversion (Turndown + boundary-aware truncation)
// ══════════════════════════════════════════════════════════════

import { docs } from './docs.router.js';
import { f } from '../vurb.js';
import { ContentPresenter } from '../views/content.presenter.js';
import TurndownService from 'turndown';
import {
    fetchUrl, resolveGitHubUrl, isGitHubUrl,
    detectFormat, detectLoginWall, detectEmbed,
    cleanHtml, extractTitle, extractSPAContent, isEmptySPA,
    extractNavLinks, truncate,
    summarizeSpec, specToMarkdown,
    renderWithBrowser,
    DocCache,
} from '../engine/index.js';
import type { DocFormat } from '../engine/index.js';

// ── Turndown Instance ────────────────────────────────────────

const turndown = new TurndownService({
    headingStyle:   'atx',
    codeBlockStyle: 'fenced',
    bulletListMarker: '-',
});

// ── Content Cache ────────────────────────────────────────────

interface CachedPage {
    readonly content: string;
    readonly format: string;
    readonly title: string;
    readonly navLinks: ReadonlyArray<{ title: string; url: string }>;
}

const pageCache = new DocCache<CachedPage>(5 * 60 * 1000); // 5 min TTL

// ── Tool Definition ──────────────────────────────────────────

export const read = docs.query('read')
    .describe('Read any documentation URL and return clean, LLM-ready Markdown')
    .instructions(
        'Reads a documentation page and returns clean Markdown. ' +
        'Handles HTML, JSON, YAML, OpenAPI specs, Postman Collections, PDFs (<5MB), and llms.txt. ' +
        'The response includes a "Related Documentation Links" section extracted from page navigation. ' +
        'ALWAYS check these links for authentication and getting-started pages before generating code.'
    )
    .withString('url', 'Full URL of the documentation page to read')
    .withOptionalNumber('max_length', 'Maximum output length in characters (default: 20000)')
    .returns(ContentPresenter)
    .cached()
    .concurrency({ maxActive: 3, maxQueue: 5 })
    .egress(100_000)
    .handle(async (input, ctx) => {
        ctx.requestCount++;

        const maxLength = input.max_length ?? 20_000;

        // ── Cache Hit ────────────────────────────────────────
        const cached = pageCache.get(input.url);
        if (cached) {
            const { content, truncated } = truncate(cached.content, maxLength);
            return {
                url:       input.url,
                content,
                format:    cached.format,
                nav_links: cached.navLinks,
                truncated,
                cached:    true,
            };
        }

        // ── Step 1: GitHub URL Resolution ────────────────────
        let targetUrl = input.url;
        if (isGitHubUrl(targetUrl)) {
            const resolved = resolveGitHubUrl(targetUrl);
            if (resolved) targetUrl = resolved.raw;
        }

        // ── Step 2: Fetch ────────────────────────────────────
        const fetched = await fetchUrl(targetUrl);

        if (fetched.status >= 400 && !fetched.fromArchive) {
            return f.error('FETCH_FAILED', `HTTP ${fetched.status} for ${input.url}`)
                .suggest(
                    'The page returned an error. Try: ' +
                    `1) docs.search({ query: "<topic>", site: "${new URL(input.url).hostname}" }) to find an alternative page. ` +
                    '2) docs.discover({ query: "<service name>" }) to find documentation sources.'
                )
                .actions('docs.search', 'docs.discover')
                .warning();
        }

        // ── Step 3: Login Wall Detection ─────────────────────
        const wall = detectLoginWall(input.url, fetched.body, fetched.redirectedUrl);
        if (wall.blocked) {
            return f.error('LOGIN_WALL', `Page requires authentication (${wall.reason})`)
                .suggest(
                    'This documentation requires login. Try: ' +
                    `1) docs.search({ query: "<topic> site:github.com" }) to find public source docs. ` +
                    '2) docs.discover({ query: "<service> openapi spec" }) to find the raw API spec.'
                )
                .actions('docs.search', 'docs.discover')
                .warning();
        }

        // ── Step 4: Format Detection ─────────────────────────
        const format = detectFormat(targetUrl, fetched.contentType, fetched.body);

        // ── Step 5: Spec Summarization ───────────────────────
        if (isSpecFormat(format)) {
            return handleSpec(input.url, fetched.body, format, maxLength);
        }

        // ── Step 6: Plain text / Markdown passthrough ────────
        if (format === 'llms_txt' || format === 'markdown' || format === 'plaintext') {
            const { content, truncated } = truncate(fetched.body, maxLength);
            cacheResult(input.url, fetched.body, format, '', []);
            return {
                url:       input.url,
                content,
                format,
                nav_links: [],
                truncated,
                cached:    false,
            };
        }

        // ── Steps 6-7: SPA Hydration ────────────────────────
        let html = fetched.body;

        if (isEmptySPA(html)) {
            const hydration = extractSPAContent(html);
            if (hydration.content) {
                const { content, truncated } = truncate(hydration.content, maxLength);
                cacheResult(input.url, hydration.content, 'html', '', []);
                return {
                    url:       input.url,
                    content,
                    format:    'html',
                    nav_links: [],
                    truncated,
                    cached:    false,
                };
            }

            // 🔫 Headless fallback — render with Chrome if available
            const rendered = await renderWithBrowser(input.url);
            if (rendered && !isEmptySPA(rendered)) {
                html = rendered;
                // Fall through to normal HTML cleaning + Turndown below
            } else {
                // SPA with no hydration data and no browser available
                return f.error('SPA_CONTENT_EMPTY', 'This page requires JavaScript rendering.')
                    .suggest(
                        'This documentation site is a pure SPA. Try these alternatives: ' +
                        '1) docs.search({ query: "<service> API docs site:github.com" }) to find raw docs. ' +
                        '2) docs.discover({ query: "<service> llms.txt" }) to find LLM-ready documentation. ' +
                        '3) docs.discover({ query: "<service> openapi spec" }) to find the API spec directly.'
                    )
                    .actions('docs.search', 'docs.discover')
                    .warning();
            }
        }

        // ── Step 8: iFrame Detection ─────────────────────────
        const embed = detectEmbed(html, input.url);
        if (embed.detected && embed.specUrl) {
            return f.error('EMBEDDED_SPEC', `Found embedded ${embed.platform} spec`)
                .suggest(
                    `This page contains an embedded ${embed.platform} API viewer. ` +
                    `Read the raw spec with: docs.read({ url: "${embed.specUrl}" }) ` +
                    `or extract endpoints with: docs.extract({ url: "${embed.specUrl}" })`
                )
                .actions('docs.read', 'docs.extract')
                .warning();
        }

        if (embed.detected && embed.iframeSrc) {
            return f.error('IFRAME_EMBED', `Found embedded documentation in iframe`)
                .suggest(`Read the embedded content: docs.read({ url: "${embed.iframeSrc}" })`)
                .actions('docs.read')
                .warning();
        }

        // ── Step 9: HTML Cleaning ────────────────────────────
        const cleanedHtml = cleanHtml(html);

        // ── Step 10: Title + Nav Extraction ──────────────────
        const title    = extractTitle(html);
        const navLinks = extractNavLinks(html, input.url);

        // ── Step 11: Markdown Conversion + Truncation ────────
        let markdown = turndown.turndown(cleanedHtml);

        // Prepend title if not already in content
        if (title && !markdown.startsWith(`# ${title}`)) {
            markdown = `# ${title}\n\n${markdown}`;
        }

        const { content, truncated } = truncate(markdown, maxLength);

        cacheResult(input.url, markdown, format, title, [...navLinks]);

        return {
            url:       input.url,
            content,
            format,
            nav_links: navLinks.slice(0, 20),
            truncated,
            cached:    false,
        };
    });

// ── Spec Handling ────────────────────────────────────────────

function isSpecFormat(format: DocFormat): boolean {
    return format === 'openapi' || format === 'swagger' || format === 'json' || format === 'yaml';
}

function handleSpec(url: string, body: string, format: DocFormat, maxLength: number) {
    try {
        const summary  = summarizeSpec(body);
        const markdown = specToMarkdown(summary);
        const { content, truncated } = truncate(markdown, maxLength);

        cacheResult(url, markdown, format, summary.title, []);

        return {
            url,
            content,
            format,
            nav_links: [],
            truncated,
            cached:    false,
        };
    } catch {
        // Not a valid spec — fall through to raw content
        const { content, truncated } = truncate(body, maxLength);
        return {
            url,
            content,
            format,
            nav_links: [],
            truncated,
            cached:    false,
        };
    }
}

// ── Cache Helper ─────────────────────────────────────────────

function cacheResult(
    url: string,
    content: string,
    format: string,
    title: string,
    navLinks: Array<{ title: string; url: string }>,
): void {
    pageCache.set(url, { content, format, title, navLinks });
}
