/**
 * Simple in-memory cache for API responses to reduce redundant LLM calls.
 * Caches by text hash (SHA-256 like simple hash).
 */

function hashText(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return `h${Math.abs(hash)}`;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Get cached data if available and not expired.
 */
export function getCached<T>(key: string, text: string): T | null {
  const fullKey = `${key}:${hashText(text)}`;
  const entry = cache.get(fullKey);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    cache.delete(fullKey);
    return null;
  }
  return entry.data as T;
}

/**
 * Set data in cache.
 */
export function setCached<T>(key: string, text: string, data: T): void {
  const fullKey = `${key}:${hashText(text)}`;
  cache.set(fullKey, { data, timestamp: Date.now() });
}

/**
 * Clear all cached entries.
 */
export function clearCache(): void {
  cache.clear();
}

/**
 * Get the number of cached entries (for monitoring).
 */
export function getCacheSize(): number {
  return cache.size;
}