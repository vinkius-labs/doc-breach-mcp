// ══════════════════════════════════════════════════════════════
// 🔐 TACTICAL BYPASS: WALL DETECTION
//
// Some companies lock their PUBLIC API docs behind OAuth gates.
// We detect the wall instantly and tell the agent to find the
// docs elsewhere. Brains over brawn.
// ══════════════════════════════════════════════════════════════

// ── Types ────────────────────────────────────────────────────

export type WallReason =
    | 'none'
    | 'login_redirect'
    | 'login_form'
    | 'auth_meta'
    | 'paywall';

export interface LoginWallResult {
    readonly blocked: boolean;
    readonly reason: WallReason;
    readonly originalUrl: string;
    readonly redirectedTo?: string;
}

// ── Detector Registry ────────────────────────────────────────

interface WallDetector {
    readonly reason: WallReason;
    readonly detect: (body: string, originalUrl: string, redirectedUrl?: string) => boolean;
}

const DETECTORS: readonly WallDetector[] = [
    { reason: 'login_redirect', detect: isLoginRedirect },
    { reason: 'login_form',     detect: hasLoginForm },
    { reason: 'auth_meta',      detect: hasAuthMeta },
    { reason: 'paywall',        detect: hasPaywall },
];

// ── Public API ───────────────────────────────────────────────

/**
 * Detect whether a page requires authentication.
 *
 * Runs fast (<1ms). Detects and reports — does NOT attempt bypass.
 */
export function detectLoginWall(
    originalUrl: string,
    body: string,
    redirectedUrl?: string,
): LoginWallResult {
    for (const { reason, detect } of DETECTORS) {
        if (detect(body, originalUrl, redirectedUrl)) {
            return {
                blocked: true,
                reason,
                originalUrl,
                ...(reason === 'login_redirect' && redirectedUrl ? { redirectedTo: redirectedUrl } : {}),
            };
        }
    }

    return { blocked: false, reason: 'none', originalUrl };
}

// ── Detectors ────────────────────────────────────────────────

const LOGIN_PATHS: readonly string[] = [
    '/login', '/signin', '/sign-in', '/sign_in',
    '/authorize', '/oauth', '/auth/',
    '/sso/', '/saml/',
    '/account/login', '/user/login',
];

function isLoginRedirect(_body: string, originalUrl: string, redirectedUrl?: string): boolean {
    if (!redirectedUrl || redirectedUrl === originalUrl) return false;
    const path = new URL(redirectedUrl).pathname.toLowerCase();
    return LOGIN_PATHS.some(p => path.includes(p));
}

const LOGIN_FORM_PATTERNS: readonly RegExp[] = [
    /<form[^>]*>[\s\S]{0,2000}<input[^>]*type\s*=\s*["']password["']/i,
    /<input[^>]*name\s*=\s*["'](?:username|email|login)["'][^>]*>[\s\S]{0,2000}<input[^>]*type\s*=\s*["']password["']/i,
];

function hasLoginForm(body: string): boolean {
    const slice = body.slice(0, 10_000);
    return LOGIN_FORM_PATTERNS.some(p => p.test(slice));
}

const AUTH_META_PATTERNS: readonly RegExp[] = [
    /meta\s+http-equiv\s*=\s*["']refresh["'][^>]*url\s*=\s*[^"']*(?:login|signin|auth)/i,
    /window\.location\s*=\s*["'][^"']*(?:login|signin|oauth)/i,
    /location\.href\s*=\s*["'][^"']*(?:login|signin|oauth)/i,
];

function hasAuthMeta(body: string): boolean {
    return AUTH_META_PATTERNS.some(p => p.test(body.slice(0, 15_000)));
}

const PAYWALL_PATTERNS: readonly RegExp[] = [
    /class\s*=\s*["'][^"']*paywall[^"']*["']/i,
    /class\s*=\s*["'][^"']*subscription-gate[^"']*["']/i,
    /id\s*=\s*["']paywall["']/i,
    /data-paywall/i,
];

function hasPaywall(body: string): boolean {
    return PAYWALL_PATTERNS.some(p => p.test(body.slice(0, 20_000)));
}
