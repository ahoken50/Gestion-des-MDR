// Request caching service using localStorage
// Provides fast loading and offline capability

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number; // Time to live in milliseconds
}

class CacheService {
    private readonly CACHE_PREFIX = 'mdr_cache_';
    private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

    /**
     * Store data in cache
     */
    set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
        try {
            const entry: CacheEntry<T> = {
                data,
                timestamp: Date.now(),
                ttl
            };
            localStorage.setItem(`${this.CACHE_PREFIX}${key}`, JSON.stringify(entry));
        } catch (error) {
            console.error('Cache set error:', error);
            // If localStorage is full, clear old entries
            this.clearExpired();
        }
    }

    /**
     * Get data from cache
     */
    get<T>(key: string): T | null {
        try {
            const item = localStorage.getItem(`${this.CACHE_PREFIX}${key}`);
            if (!item) return null;

            const entry: CacheEntry<T> = JSON.parse(item);
            const age = Date.now() - entry.timestamp;

            // Check if expired
            if (age > entry.ttl) {
                this.delete(key);
                return null;
            }

            return entry.data;
        } catch (error) {
            console.error('Cache get error:', error);
            return null;
        }
    }

    /**
     * Delete specific cache entry
     */
    delete(key: string): void {
        localStorage.removeItem(`${this.CACHE_PREFIX}${key}`);
    }

    /**
     * Clear all expired cache entries
     */
    clearExpired(): void {
        const keys = Object.keys(localStorage);
        const now = Date.now();

        keys.forEach(key => {
            if (key.startsWith(this.CACHE_PREFIX)) {
                try {
                    const item = localStorage.getItem(key);
                    if (item) {
                        const entry: CacheEntry<any> = JSON.parse(item);
                        if (now - entry.timestamp > entry.ttl) {
                            localStorage.removeItem(key);
                        }
                    }
                } catch (error) {
                    // Invalid entry, remove it
                    localStorage.removeItem(key);
                }
            }
        });
    }

    /**
     * Clear all cache
     */
    clearAll(): void {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith(this.CACHE_PREFIX)) {
                localStorage.removeItem(key);
            }
        });
    }

    /**
     * Check if key exists and is valid
     */
    has(key: string): boolean {
        return this.get(key) !== null;
    }
}

export const cacheService = new CacheService();
