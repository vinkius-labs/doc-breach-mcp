// ══════════════════════════════════════════════════════════════
// 💥 DocBreach MCP — DDG Lite Transport
//
// Zero API keys. Zero rate limits. Zero cost.
// DuckDuckGo Lite serves plain HTML — no JS rendering needed.
// ══════════════════════════════════════════════════════════════

const DDG_LITE_URL = 'https://lite.duckduckgo.com/lite/';
const DDG_TIMEOUT  = 10_000;
const DDG_UA       = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

/**
 * Fetch search results HTML from DuckDuckGo Lite.
 */
export async function fetchLite(query: string): Promise<string> {
    const response = await fetch(DDG_LITE_URL, {
        method:  'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent':   DDG_UA,
        },
        body:   new URLSearchParams({ q: query, kl: '' }).toString(),
        signal: AbortSignal.timeout(DDG_TIMEOUT),
    });

    if (!response.ok) throw new Error(`DDG ${response.status}`);
    return response.text();
}
