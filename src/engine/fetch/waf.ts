// ══════════════════════════════════════════════════════════════
// 🛡️ WAF Challenge Detection
//
// CDN challenge pages (Cloudflare, Akamai, Incapsula) all include
// distinctive fingerprints in the first 5KB of HTML. We check
// all known signatures in one pass.
// ══════════════════════════════════════════════════════════════

const WAF_SIGNATURES: readonly string[] = [
    'cf-browser-verification', 'challenge-platform',
    'checking your browser',   'enable javascript and cookies',
    'access denied',           'attention required',
    '_cf_chl',                 'just a moment...',
];

/**
 * Detect whether an HTML response is a WAF/CDN challenge page.
 *
 * Only inspects the first 5KB for performance — challenge
 * markers are always near the top of the page.
 */
export function isWafChallenge(html: string): boolean {
    const lower = html.slice(0, 5_000).toLowerCase();
    return WAF_SIGNATURES.some(sig => lower.includes(sig));
}
