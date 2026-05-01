<div align="center">
  <h1>💥 DocBreach <sup>(MCP)</sup></h1>
  <p><b>The web is hostile to AI Agents. We brought a crowbar.</b></p>
  <br />
  <p>
    <a href="#"><img src="https://img.shields.io/badge/SaaS_Dependencies-Zero-red?style=for-the-badge" /></a>
    <a href="#"><img src="https://img.shields.io/badge/WAF_Bypass-Automated-success?style=for-the-badge" /></a>
    <a href="#"><img src="https://img.shields.io/badge/Cost-$0.00_Forever-blue?style=for-the-badge" /></a>
    <a href="#"><img src="https://img.shields.io/badge/Transport-STDIO-black?style=for-the-badge" /></a>
  </p>
  <p>
    <a href="#-quickstart">Quickstart</a> · <a href="#%EF%B8%8F-the-weapon-guerrilla-architecture">Architecture</a> · <a href="#-the-uncomfortable-truth">Why This Exists</a>
  </p>
  <img width="893" height="620" alt="image" src="https://github.com/user-attachments/assets/44586e85-7289-49ed-ba95-bd53392cfa86" />
</div>

---

## 🛑 The Problem: Agentic Workflows Are Blind

We're in the era of autonomous AI Agents — but the web was built to repel bots, not serve them.

When your Claude, Cursor, or Windsurf tries to read an obscure API's documentation, it gets annihilated by:

1. **Cloudflare WAFs** throwing 403 CAPTCHAs at Node.js `fetch()`.
2. **Empty SPA shells** (Next.js, Mintlify, GitBook) that render nothing without a $300M headless browser.
3. **Legacy enterprise PDFs** that crash the model's context window.
4. **Login walls** that lock public API references behind OAuth gates.
5. **"AI-friendly" SaaS tools** (Firecrawl, Jina, Context7) charging you **$50/mo** to read pages that are already public.

The LLM doesn't need a middleman. It needs **raw signal**.

---

## ⚔️ The Weapon: Guerrilla Architecture

**DocBreach** is a ruthless, 100% local MCP server. It doesn't ask for permission. It uses military-grade heuristics to extract clean, LLM-optimized Markdown from **any** developer portal — and it does it for free, forever.

| Enemy Defense | DocBreach Tactical Override |
| :--- | :--- |
| 🛡️ **Cloudflare / WAF 403** | **Temporal Proxying** — Hits a WAF? Silently pivots to the Wayback Machine. The docs from last week work just fine. |
| ⚛️ **JavaScript SPA Walls** | **Hydration Hijacking** — Rips `__NEXT_DATA__`, `__NUXT__`, `__GITBOOK_STATE__` straight from the DOM. Zero JS engine needed. |
| 🪟 **Hidden iFrames** | **Source Chasing** — Detects embedded Swagger/Postman/Stoplight apps, destroys the wrapper, resolves the true origin URL. |
| 📄 **Legacy PDF Manuals** | **Native Brute-Force** — In-memory PDF parsing. Your AI reads 2004 banking manuals like they're GitHub READMEs. |
| 🔐 **Login Walls** | **Wall Detection** — Identifies OAuth/SSO gates instantly and tells the agent to pivot to public alternatives. |
| 🕳️ **Ghost Town Sites** | **Self-Healing Errors** — No docs found? DocBreach guides the agent to search GitHub repos, SDK source code, or `llms.txt` files. |
| 💸 **SaaS Scraping Taxes** | **Zero. Forever.** Everything runs locally via Cheerio and Turndown. No API keys. No accounts. No telemetry. |

> *"The LLM shouldn't be smart at scraping. It should be smart at coding. DocBreach handles the dirty work."*

---

## 🚀 Quickstart

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "docbreach": {
      "command": "npx",
      "args": ["-y", "doc-breach-mcp"]
    }
  }
}
```

### Cursor / Windsurf

Add to your MCP settings:

```json
{
  "doc-breach": {
    "command": "npx",
    "args": ["-y", "doc-breach-mcp"]
  }
}
```

That's it. No API keys. No `.env` files. No sign-ups. **It just works.**

---

## 🧠 How It Thinks

DocBreach gives your AI agent **4 precision tools** and lets the model drive:

```
You: "Integrate with the Datadog API and list all monitors"

Agent → docs.discover({ query: "datadog API" })
     ← Found: docs.datadoghq.com/api/latest/ (openapi)

Agent → docs.map({ domain: "docs.datadoghq.com" })
     ← 🗺️ Sitemap hierarchy, auto-generated Mermaid graph, and llms.txt discovery

Agent → docs.read({ url: "https://docs.datadoghq.com/api/latest/" })
     ← 📄 Clean Markdown + nav links + auth requirements

Agent → docs.extract({ url: "https://api.datadoghq.com/api/v2/openapi.yaml", tag: "monitors" })
     ← 📋 GET /api/v1/monitor — List all monitors
        GET /api/v1/monitor/{id} — Get a monitor's details
        POST /api/v1/monitor — Create a monitor
        ...

Agent: "I see the API requires DD-API-KEY and DD-APPLICATION-KEY headers,
        and you need to select a DD_SITE (US1, EU, US3, US5, AP1)..."
```

The model **reasons**. DocBreach **retrieves**. Nobody hallucinates.

### The 11-Step Reader Pipeline

Every URL passes through a battle-hardened, 11-step extraction pipeline:

```
 URL
  │
  ├─ 1. Preflight ──────── HEAD check → Content-Type, size, reject >10MB
  ├─ 2. Fetch ──────────── GET + Wayback Machine fallback on 403/503
  ├─ 3. Login Detection ── OAuth/SSO wall? → abort + guide agent
  ├─ 4. Format Detection ─ OpenAPI? Postman? PDF? llms.txt? Markdown?
  ├─ 5. Binary Handling ── PDF <5MB → in-memory parse
  ├─ 6. Spec Summary ───── OpenAPI/Postman → structured Markdown
  ├─ 7. SPA Hydration ──── __NEXT_DATA__, __NUXT__, readme-data, GitBook
  ├─ 8. Nav Extraction ─── Sidebar links → absolute URLs
  ├─ 9. iFrame Intel ───── Swagger/Postman/Stoplight embed → true URL
  ├─ 10. HTML Cleaning ─── Cheerio → remove headers, footers, ads, nav
  └─ 11. Markdown ──────── Turndown + boundary-aware truncation
  │
  ▼
 Clean, LLM-ready Markdown
```

---

## 🪖 The Uncomfortable Truth

The developer tooling market has a parasite problem.

Companies like Firecrawl, Jina Reader, and Context7 take **public documentation** — pages that are freely accessible to any browser — wrap them in a proprietary API, and charge you a monthly subscription to access what was already yours.

They aren't adding value. They're adding a **toll booth** to the public internet.

DocBreach exists because:

- **Documentation is public.** If a human can read it, an agent should too.
- **Scraping is a solved problem.** Cheerio + Turndown have existed for a decade. You don't need a $20M startup to parse HTML.
- **Your AI runs locally.** Why should it phone home to a SaaS to read a README?

This is not a product. This is a **crowbar**.

---

## 📊 DocBreach vs. The Toll Booths

| | DocBreach | Firecrawl | Jina Reader | Context7 |
|---|:---:|:---:|:---:|:---:|
| **Cost** | $0 | $50+/mo | $30+/mo | Free (limited) |
| **Runs locally** | ✅ | ❌ Cloud | ❌ Cloud | ❌ Cloud |
| **No API keys** | ✅ | ❌ | ❌ | ❌ |
| **No telemetry** | ✅ | ❌ | ❌ | ❌ |
| **WAF bypass** | ✅ Wayback | ✅ Paid proxy | ❌ | ❌ |
| **SPA extraction** | ✅ Hydration | ✅ Headless | ❌ | ❌ |
| **PDF parsing** | ✅ Native | ✅ | ❌ | ❌ |
| **OpenAPI extraction** | ✅ | ❌ | ❌ | ❌ |
| **HATEOAS navigation** | ✅ | ❌ | ❌ | ❌ |
| **Cognitive rules** | ✅ | ❌ | ❌ | ❌ |
| **Open source** | ✅ MIT | Partial | ❌ | ✅ |

---

## 🔧 Tools Reference

### `docs.discover`
> Find documentation sources for any service, library, or API.

```typescript
docs.discover({ query: "stripe webhooks API" })
// → [ { url, title, type: "openapi", source: "probe" }, ... ]
```

### `docs.map`
> Map the complete documentation structure of any domain. Extracts sitemaps, robots.txt, and llms.txt, returning an architectural blueprint.

```typescript
docs.map({ domain: "docs.stripe.com" })
// → { total: 1200, sections: { "Root": [...], "API": [...] }, ... }
```

### `docs.read`
> Read any documentation URL and return clean, LLM-ready Markdown.

```typescript
docs.read({ url: "https://docs.stripe.com/webhooks" })
// → { content: "# Webhooks\n\n...", nav_links: [...], format: "html" }
```

### `docs.search`
> Search for specific topics within a documentation site.

```typescript
docs.search({ query: "authentication", site: "docs.stripe.com" })
// → [ { url: ".../authentication", title: "Authentication", ... } ]
```

### `docs.extract`
> Extract structured endpoint information from OpenAPI/Swagger/Postman specs.

```typescript
docs.extract({ url: "https://api.stripe.com/openapi/spec.json", tag: "charges" })
// → [ { method: "POST", path: "/v1/charges", summary: "Create a charge" }, ... ]
```

---

## 🏆 Beyond the MCP Specification

Google and Anthropic's official MCP best practices ask for "Single Responsibility," "Clear Descriptions," and "Structured Error Handling." That is the bare minimum.

Thanks to [**Vurb.ts**](https://github.com/VinkiusLabs/vurb-ts), DocBreach elevates these concepts to the tenth power, operating years ahead of the standard protocol:

- **MVA Architecture (Model → View → Agent)**: Standard MCP returns raw JSON strings. We route everything through Fluent Presenters acting as smart egress firewalls, stripping noise before the LLM ever sees it.
- **HATEOAS Navigation**: Instead of the agent guessing what to do next, every DocBreach response includes a `.suggestActions()` payload telling the model exactly which tool to call next.
- **JIT System Rules**: Dynamic instructions injected mid-flight based on payload context (e.g., *"The content was truncated, use search"*).
- **Self-Healing Errors**: Standard MCP throws an error. DocBreach returns an error *and* the exact prompt/tool required to recover from it.
- **Server-Side Mermaid UI**: Sends native `ui.mermaid()` visual graphs to the MCP Inspector to help humans see the architecture the agent sees.
- **State Sync & Cache Control**: Emits `.cached()` directives at the protocol level to eliminate duplicate requests and save LLM token context.

---

## 📄 License

MIT — because documentation should be free, and so should the tools that read it.

---

<div align="center">
  <br />
  <p><b>Stop paying rent to read public web pages.</b></p>
  <p>⭐ Star this repo if you agree.</p>
</div>
