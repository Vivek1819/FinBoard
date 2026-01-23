type CacheEntry = {
  data: any;
  timestamp: number;
};

const cache = new Map<string, CacheEntry>();

/**
 * Fetch with in-memory caching + TTL
 */
export async function cachedFetch(
  url: string,
  ttlMs: number = 120_000 // default 120 seconds
): Promise<any> {
  const now = Date.now();
  const cached = cache.get(url);

  // ✅ Serve from cache if still valid
  if (cached && now - cached.timestamp < ttlMs) {
    return cached.data;
  }

  // 🌐 Fetch fresh data
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`HTTP_${res.status}`);
  }

  const data = await res.json();

  // 💾 Store in cache
  cache.set(url, {
    data,
    timestamp: now,
  });

  return data;
}

/**
 * Optional helpers (useful later)
 */
export function clearApiCache() {
  cache.clear();
}

export function getApiCacheSize() {
  return cache.size;
}
