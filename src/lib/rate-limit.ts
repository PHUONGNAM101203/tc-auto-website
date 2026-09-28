/**
 * Gioi han tan so don gian trong bo nho (sliding window).
 * Du cho 1 instance; khi scale nhieu instance nen thay bang Upstash/Redis.
 */

interface Bucket {
  hits: number[];
}

const BUCKETS = new Map<string, Bucket>();
const SWEEP_EVERY = 500;
let calls = 0;

export interface RateLimitResult {
  readonly allowed: boolean;
  readonly remaining: number;
  readonly retryAfterSeconds: number;
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const since = now - windowMs;

  const bucket = BUCKETS.get(key) ?? { hits: [] };
  const hits = bucket.hits.filter((at) => at > since);

  // Don dinh ky de Map khong phinh vo han.
  calls += 1;
  if (calls % SWEEP_EVERY === 0) {
    for (const [existingKey, existing] of BUCKETS) {
      if (existing.hits.every((at) => at <= since)) {
        BUCKETS.delete(existingKey);
      }
    }
  }

  if (hits.length >= limit) {
    const oldest = hits[0] ?? now;
    BUCKETS.set(key, { hits });
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((oldest + windowMs - now) / 1000)),
    };
  }

  hits.push(now);
  BUCKETS.set(key, { hits });
  return { allowed: true, remaining: limit - hits.length, retryAfterSeconds: 0 };
}

/** Lay IP client tu header cua proxy (Vercel / Nginx), fallback "unknown". */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return headers.get("x-real-ip")?.trim() || "unknown";
}

/** Chi dung trong test de reset trang thai giua cac case. */
export function resetRateLimits(): void {
  BUCKETS.clear();
  calls = 0;
}
