import { NextRequest } from "next/server";

type Bucket = {
  count: number;
  resetAt: number;
  blockedUntil: number;
};

type RateLimitOptions = {
  limit: number;
  windowMs: number;
  blockMs: number;
};

const buckets = new Map<string, Bucket>();

function getClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");

  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() ?? "unknown";
  if (realIp) return realIp;

  return "unknown";
}

export function getRateLimitKey(request: NextRequest, scope: string) {
  return `${scope}:${getClientIp(request)}`;
}

export function checkRateLimit(key: string, options: RateLimitOptions) {
  const now = Date.now();
  const current = buckets.get(key);

  if (current?.blockedUntil && current.blockedUntil > now) {
    return {
      allowed: false,
      retryAfter: Math.ceil((current.blockedUntil - now) / 1000),
      remaining: 0,
    };
  }

  if (!current || current.resetAt <= now) {
    buckets.set(key, {
      count: 1,
      resetAt: now + options.windowMs,
      blockedUntil: 0,
    });

    return {
      allowed: true,
      retryAfter: 0,
      remaining: options.limit - 1,
    };
  }

  if (current.count >= options.limit) {
    current.blockedUntil = now + options.blockMs;
    buckets.set(key, current);

    return {
      allowed: false,
      retryAfter: Math.ceil(options.blockMs / 1000),
      remaining: 0,
    };
  }

  current.count += 1;
  buckets.set(key, current);

  return {
    allowed: true,
    retryAfter: 0,
    remaining: Math.max(0, options.limit - current.count),
  };
}
