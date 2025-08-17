import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { env } from "./env";
import type { NextRequest } from "next/server";

const redis = new Redis({ url: env.rate.url, token: env.rate.token });
const limiter = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(env.rate.maxReq, `${env.rate.windowSec} s`) });

export async function guardRate(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.ip || "unknown";
  const blockKey = `block:${ip}`;

  const blocked = await redis.get<string>(blockKey);
  if (blocked) return { ok: false, status: 429 as const, reason: "cooldown" };

  const { success, remaining, reset } = await limiter.limit(`rl:${ip}`);
  if (!success) {
    await redis.set(blockKey, "1", { ex: env.rate.abuseCooldownSec });
    return { ok: false, status: 429 as const, reason: "rate_exceeded", remaining, reset };
  }
  return { ok: true as const };
}
