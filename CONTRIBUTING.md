# Contributing to DocBreach MCP

First off — **thank you**. Every contributor makes the AI agent ecosystem less dependent on rent-seeking SaaS middlemen.

## 🧭 Philosophy

DocBreach exists to give AI agents free, unrestricted access to public documentation. Before contributing, internalize these principles:

1. **Zero external services.** No API keys, no cloud dependencies, no telemetry. Everything runs locally.
2. **Pure JavaScript only.** Every dependency must work in a standard Node.js runtime. No native binaries, no C++ addons.
3. **The LLM is the brain.** DocBreach retrieves and cleans. It never reasons, summarizes, or interprets content. That's the model's job.
4. **Tactical Lore.** Code comments in `src/engine/` follow the [Tactical Lore style](#-tactical-lore). If your bypass doesn't have a war story, it's not done.

## 🚀 Getting Started

```bash
# Clone the repo
git clone https://github.com/VinkiusLabs/doc-breach-mcp.git
cd doc-breach-mcp

# Install dependencies
npm install

# Run in development mode
npm run dev
```

## 📁 Project Structure

```
src/
├── context.ts           ← Shared context type
├── server.ts            ← STDIO bootstrap
├── engine/              ← Pure functions — the battlefield
├── models/              ← defineModel() — domain entities
├── views/               ← definePresenter() — egress firewalls
├── agents/              ← Tool definitions — the interface
└── data/                ← Static registries
```

### Where to contribute

| I want to... | Go to... |
|---|---|
| Add a new bypass technique | `src/engine/` |
| Improve content extraction | `src/engine/cleaner.ts` or `src/engine/hydration.ts` |
| Add a new doc format | `src/engine/format-detector.ts` |
| Fix a parsing bug | `src/engine/reader.ts` |
| Add entries to the known docs registry | `src/data/registry.ts` |
| Improve agent guidance | `src/views/*.presenter.ts` |

## 🪖 Tactical Lore

All engine modules **must** include Tactical Lore comments. This is not optional — it's a core part of the project identity.

### Format

```typescript
// 🛡️ TACTICAL BYPASS: <NAME IN CAPS>
// <2-3 lines explaining the enemy defense and our counter-move>
// <Witty punchline>
if (condition) {
    logger.warn(`Message with ${context}. Executing <tactic>...`);
    return await counterMove();
}
```

### Emoji prefixes

| Emoji | Category |
|-------|----------|
| 🛡️ | WAF / Firewall bypass |
| ⚛️ | SPA / JavaScript wall |
| 🪟 | iFrame / embed detection |
| 📄 | PDF / binary handling |
| 🔐 | Login wall detection |
| 🕳️ | Ghost town / empty content |
| ⏱️ | Wayback Machine / temporal proxy |
| 🧹 | HTML cleaning |
| 🗺️ | Navigation extraction |
| 💀 | Fatal / unrecoverable |

## 🔀 Pull Request Process

1. **One feature per PR.** Small, focused changes get reviewed and merged faster.
2. **Write a clear title.** Use the format: `feat: add GitBook hydration support` or `fix: handle empty PDF buffers`.
3. **Include Tactical Lore.** If your PR adds a new bypass or engine step, the comments must follow the lore style.
4. **Test locally.** Run the server against a real documentation site before submitting.
5. **No SaaS dependencies.** If your PR requires an API key, an external service, or a cloud account, it will be rejected.

## 🐛 Bug Reports

Open an issue with:
- The URL you tried to read
- The error or empty content you received
- Your Node.js version (`node -v`)

## 💡 Feature Requests

Open an issue with the `enhancement` label. Describe:
- What documentation source or format isn't supported
- A real URL where the problem occurs
- Why the current pipeline fails on it

## 📄 License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).

---

<div align="center">
  <b>Every PR is a brick removed from the paywall.</b>
</div>
