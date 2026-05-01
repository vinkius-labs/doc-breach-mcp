// ══════════════════════════════════════════════════════════════
// 💥 DocBreach MCP — In-Memory TTL Cache
// No Redis. No DynamoDB. A Map<string, T> with expiry.
// Every STDIO session starts clean. When the process dies,
// the cache dies with it. That's not a bug — it's the design.
// ══════════════════════════════════════════════════════════════

interface CacheEntry<T> {
    value: T;
    expiresAt: number;
}

const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Lightweight in-memory cache with TTL eviction.
 *
 * Not shared between processes. Not persisted. By design.
 * The crowbar doesn't need state — it needs speed.
 */
export class DocCache<T = string> {
    private store = new Map<string, CacheEntry<T>>();
    private readonly ttlMs: number;

    constructor(ttlMs = DEFAULT_TTL_MS) {
        this.ttlMs = ttlMs;
    }

    get(key: string): T | undefined {
        const entry = this.store.get(key);
        if (!entry) return undefined;

        if (Date.now() > entry.expiresAt) {
            this.store.delete(key);
            return undefined;
        }

        return entry.value;
    }

    set(key: string, value: T, ttlMs?: number): void {
        this.store.set(key, {
            value,
            expiresAt: Date.now() + (ttlMs ?? this.ttlMs),
        });
    }

    has(key: string): boolean {
        return this.get(key) !== undefined;
    }

    delete(key: string): void {
        this.store.delete(key);
    }

    clear(): void {
        this.store.clear();
    }

    get size(): number {
        // Lazy eviction: count only non-expired entries
        let count = 0;
        const now = Date.now();
        for (const [key, entry] of this.store) {
            if (now > entry.expiresAt) {
                this.store.delete(key);
            } else {
                count++;
            }
        }
        return count;
    }
}
