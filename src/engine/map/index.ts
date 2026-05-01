// ══════════════════════════════════════════════════════════════
// 💥 DocBreach MCP — Sitemap Orchestrator (Public API)
// 🗺️ TACTICAL ROLE: THE GENERAL
//
// Composes llms.txt, sitemap.xml, and nav link extraction
// into a single mapping pipeline. This is the entry point
// for the docs.map tool.
//
// Pipeline priority:
//   1. llms.txt / llms-full.txt  (AI-native, highest value)
//   2. sitemap.xml               (comprehensive URL list)
//   3. Homepage nav links        (fallback — always works)
//
// If llms.txt exists and has entries, we STILL try sitemap.xml
// to fill gaps. The result is a merged, deduplicated map.
// ══════════════════════════════════════════════════════════════

export type { SiteMapEntry, SiteMapResult } from './types.js';

import type { SiteMapEntry, SiteMapResult } from './types.js';
import { parseLlmsTxt } from './llms-txt.js';
import { parseSitemapXml } from './sitemap.js';
import { fetchUrl } from '../fetch/index.js';
import { extractNavLinks } from '../transform/nav.js';
import { groupBy } from '../shared/utils.js';

// ── Public API ───────────────────────────────────────────────

/**
 * Map the complete documentation structure of a domain.
 *
 * Probes llms.txt → sitemap.xml → homepage nav links.
 * Returns a unified, deduplicated site map with sections.
 */
export async function mapDocs(domain: string): Promise<SiteMapResult> {
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    const allEntries: SiteMapEntry[] = [];
    const sources: string[] = [];
    let llmsTxtAvailable = false;

    // ── Phase 1: llms.txt (Golden Source) ─────────────────────
    const llmsResult = await probeLlmsTxt(cleanDomain);
    if (llmsResult) {
        allEntries.push(...llmsResult.entries);
        sources.push('llms.txt');
        llmsTxtAvailable = true;
    }

    // ── Phase 2: sitemap.xml ─────────────────────────────────
    const sitemapEntries = await parseSitemapXml(cleanDomain);
    if (sitemapEntries.length > 0) {
        allEntries.push(...sitemapEntries);
        sources.push('sitemap.xml');
    }

    // ── Phase 3: Homepage nav links (Fallback) ───────────────
    if (allEntries.length < 5) {
        const navEntries = await probeNavLinks(cleanDomain);
        if (navEntries.length > 0) {
            allEntries.push(...navEntries);
            sources.push('nav_links');
        }
    }

    // ── Deduplicate & Organize ───────────────────────────────
    const deduped  = dedup(allEntries);
    const sections = groupBy(deduped, e => e.section);

    return {
        domain:              cleanDomain,
        total:               deduped.length,
        sources,
        sections,
        entries:             deduped,
        llms_txt_available:  llmsTxtAvailable,
    };
}

// ── llms.txt Probe ───────────────────────────────────────────

async function probeLlmsTxt(domain: string): Promise<ReturnType<typeof parseLlmsTxt> | null> {
    const urls = [
        `https://${domain}/llms-full.txt`,
        `https://${domain}/llms.txt`,
        `https://docs.${domain}/llms-full.txt`,
        `https://docs.${domain}/llms.txt`,
    ];

    for (const url of urls) {
        try {
            const result = await fetchUrl(url, 8_000);
            if (result.status >= 400) continue;

            // Quick validation: must have markdown-ish content
            const body = result.body.trim();
            if (!body.startsWith('#') && !body.includes('](http')) continue;

            const parsed = parseLlmsTxt(body);
            if (parsed.entries.length > 0) return parsed;
        } catch {
            continue;
        }
    }

    return null;
}

// ── Nav Links Fallback ───────────────────────────────────────

async function probeNavLinks(domain: string): Promise<SiteMapEntry[]> {
    const bases = [
        `https://docs.${domain}`,
        `https://developer.${domain}`,
        `https://developers.${domain}`,
        `https://${domain}/docs`,
    ];

    for (const base of bases) {
        try {
            const result = await fetchUrl(base, 10_000);
            if (result.status >= 400) continue;

            const navLinks = extractNavLinks(result.body, base);
            if (navLinks.length === 0) continue;

            return navLinks.map(link => ({
                url:         link.url,
                title:       link.title,
                description: '',
                section:     'Navigation',
                source:      'nav_links' as const,
            }));
        } catch {
            continue;
        }
    }

    return [];
}

// ── Deduplication ────────────────────────────────────────────

function dedup(entries: SiteMapEntry[]): SiteMapEntry[] {
    const seen = new Set<string>();
    return entries.filter(e => {
        // Normalize URL for dedup (strip trailing slash, fragment)
        const normalized = e.url.replace(/\/$/, '').replace(/#.*$/, '');
        if (seen.has(normalized)) return false;
        seen.add(normalized);
        return true;
    });
}
