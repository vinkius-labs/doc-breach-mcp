// ══════════════════════════════════════════════════════════════
// 🛡️ TACTICAL BYPASS: IDENTITY CAMOUFLAGE
//
// A naked `node-fetch` User-Agent gets blocked by ~40% of doc CDNs.
// We rotate through legitimate browser signatures. The CDN sees
// Chrome 131 requesting /docs — nothing suspicious here.
// ══════════════════════════════════════════════════════════════

const USER_AGENTS: readonly string[] = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
    'Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0',
];

/** Pick a random browser User-Agent string. */
export const randomUA = (): string =>
    USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

/** Default Accept headers for documentation fetching. */
export const DEFAULT_HEADERS: Readonly<Record<string, string>> = {
    'Accept':          'text/html,application/json,application/yaml,application/xml,*/*',
    'Accept-Language': 'en-US,en;q=0.9',
};
