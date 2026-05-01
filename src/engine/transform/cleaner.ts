// ══════════════════════════════════════════════════════════════
// 🧹 TACTICAL BYPASS: SURGICAL NOISE REMOVAL
//
// Documentation pages ship with ~70% noise. Cheerio strips them
// in <5ms. The LLM receives ONLY the content that matters.
// ══════════════════════════════════════════════════════════════

import * as cheerio from 'cheerio';

// ── Noise Selectors ──────────────────────────────────────────

const NOISE_SELECTORS: readonly string[] = [
    // Structural
    'script', 'style', 'noscript', 'iframe',
    'nav', 'footer', 'header',

    // Navigation chrome
    '.navbar', '.nav-bar', '.navigation', '.top-bar', '.topbar',
    '.sidebar', '.side-bar', '.toc', '.table-of-contents',
    '.breadcrumb', '.breadcrumbs',

    // Page furniture
    '.footer', '.site-footer', '.page-footer',
    '.cookie-banner', '.cookie-consent', '.consent-banner',
    '.announcement-bar', '.announcement-banner',

    // Interactive widgets
    '.feedback', '.feedback-widget', '.thumbs-up-down',
    '.edit-this-page', '.edit-page', '.github-edit',
    '.search-bar', '.search-modal', '.search-overlay',

    // Ads & tracking
    '.ads', '.ad-container', '.advertisement',

    // ARIA
    '[data-testid="cookie-banner"]',
    '[aria-label="navigation"]',
    '[role="navigation"]',
    '[role="banner"]',
    '[role="contentinfo"]',

    // Hidden elements
    '[style*="display:none"]', '[style*="display: none"]',
    '[hidden]', '[aria-hidden="true"]',
];

// ── Content Selectors ────────────────────────────────────────

const CONTENT_SELECTORS: readonly string[] = [
    'article', 'main', '[role="main"]',
    '.markdown-body', '.prose', '.readme-content', '.api-content',
    '.doc-content', '.documentation-content', '.article-content',
    '.content', '.main-content', '.page-content',
    '#content', '#main-content', '#doc-content',
];

// ── Public API ───────────────────────────────────────────────

/**
 * Clean HTML by removing noise and isolating documentation content.
 *
 * Returns clean HTML ready for Turndown Markdown conversion.
 */
export function cleanHtml(html: string): string {
    const $ = cheerio.load(html);

    $(NOISE_SELECTORS.join(', ')).remove();

    for (const selector of CONTENT_SELECTORS) {
        const content = $(selector).first().html();
        if (content && content.trim().length > 100) return content;
    }

    return $('body').html() ?? $.html();
}
