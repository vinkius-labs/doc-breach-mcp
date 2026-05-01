// ══════════════════════════════════════════════════════════════
// 💥 DocBreach MCP — Sitemap Types
// ══════════════════════════════════════════════════════════════

/**
 * A single entry in the documentation site map.
 * Unified format across all sources (llms.txt, sitemap.xml, nav).
 */
export interface SiteMapEntry {
    readonly url: string;
    readonly title: string;
    readonly description: string;
    readonly section: string;
    readonly source: 'llms_txt' | 'sitemap_xml' | 'nav_links';
    readonly lastmod?: string;
    readonly priority?: number;
}

/**
 * The complete site map result returned by docs.map.
 */
export interface SiteMapResult {
    readonly domain: string;
    readonly total: number;
    readonly sources: readonly string[];
    readonly sections: Record<string, readonly SiteMapEntry[]>;
    readonly entries: readonly SiteMapEntry[];
    readonly llms_txt_available: boolean;
}
