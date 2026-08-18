/**
 * Simple in-memory TTL cache.
 *
 * IMPORTANT — Vercel serverless caveat: this cache lives in the memory of a
 * single server process/instance. On Vercel, each function invocation may be
 * routed to a different, ephemeral serverless instance, and idle instances
 * are eventually recycled. This cache is therefore NOT shared across
 * instances and is NOT a durable/distributed cache — it only reduces upstream
 * calls when multiple requests land on the same warm instance within the TTL
 * window. Do not rely on it for correctness, only for reducing load on
 * upstream providers.
 */
interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class MemoryTtlCache<T> {
  private store = new Map<string, CacheEntry<T>>();

  constructor(private readonly ttlMs: number) {}

  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) {
      return undefined;
    }

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }

    return entry.value;
  }

  set(key: string, value: T): void {
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }

  clear(): void {
    this.store.clear();
  }
}
