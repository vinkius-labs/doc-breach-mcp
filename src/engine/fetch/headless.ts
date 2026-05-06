// ══════════════════════════════════════════════════════════════
// 🔫 TACTICAL BYPASS: HEADLESS RENDERING
//
// When hydration fails (empty __NEXT_DATA__, no __NUXT__, etc.),
// we fire up a headless Chrome to render the page for real.
// This is the nuclear option — heavy but unstoppable.
//
// Uses puppeteer-core with the system's Chrome installation.
// No 300MB browser downloads. Zero overhead when not needed.
// ══════════════════════════════════════════════════════════════

import type { Browser } from 'puppeteer-core';

// ── Chrome Discovery ─────────────────────────────────────────

const CHROME_PATHS = [
    // Windows
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    // macOS
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    // Linux
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/usr/bin/microsoft-edge',
];

function findChrome(): string | null {
    try {
        const fs = require('fs');
        for (const p of CHROME_PATHS) {
            if (fs.existsSync(p)) return p;
        }
    } catch { /* no fs access */ }
    return null;
}

// ── Headless Render ──────────────────────────────────────────

let _browser: Browser | null = null;

/**
 * Render a page with headless Chrome and return the fully-rendered HTML.
 *
 * Returns null if Chrome is not available or the page fails to load.
 * Timeout: 15 seconds max per page.
 */
export async function renderWithBrowser(url: string): Promise<string | null> {
    const chromePath = findChrome();
    if (!chromePath) return null;

    try {
        // Lazy-load puppeteer-core (optional dependency)
        const puppeteer = await import('puppeteer-core');

        if (!_browser) {
            _browser = await puppeteer.default.launch({
                executablePath: chromePath,
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu',
                    '--disable-extensions',
                    '--disable-background-networking',
                    '--disable-default-apps',
                    '--disable-sync',
                    '--disable-translate',
                    '--no-first-run',
                ],
                timeout: 10_000,
            });
        }

        const page = await _browser.newPage();

        try {
            await page.setUserAgent(
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
                '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
            );

            await page.goto(url, {
                waitUntil: 'networkidle2',
                timeout: 15_000,
            });

            // Wait a bit for late JS rendering
            await new Promise(r => setTimeout(r, 2000));

            const html = await page.content();
            return html;
        } finally {
            await page.close();
        }
    } catch {
        return null;
    }
}

/**
 * Cleanup — close the browser if it was opened.
 */
export async function closeBrowser(): Promise<void> {
    if (_browser) {
        try { await _browser.close(); } catch { /* already closed */ }
        _browser = null;
    }
}
