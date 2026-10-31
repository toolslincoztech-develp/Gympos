type CacheEntry<T = any> = {
  data: T;
  expiresAt: number;
};

declare global {
  var __gposCache: Map<string, CacheEntry> | undefined;
}

const cacheStore: Map<string, CacheEntry> =
  globalThis.__gposCache ?? (globalThis.__gposCache = new Map<string, CacheEntry>());

export function getCached<T = any>(key: string): T | null {
  const entry = cacheStore.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cacheStore.delete(key);
    return null;
  }
  return entry.data as T;
}

export function setCached<T = any>(key: string, data: T, ttlMs = 30000): void {
  cacheStore.set(key, {
    data,
    expiresAt: Date.now() + ttlMs,
  });
}

export function invalidateCacheKey(key: string): void {
  cacheStore.delete(key);
}

export function invalidateTenantCache(tenantId?: string | null): void {
  if (!tenantId) return;
  const prefix = `tenant:${tenantId}:`;
  for (const key of cacheStore.keys()) {
    if (key.startsWith(prefix)) {
      cacheStore.delete(key);
    }
  }
}

