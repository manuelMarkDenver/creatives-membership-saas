import { Injectable } from '@nestjs/common';
import { TapCooldownRepository } from './tap-cooldown.repository';
import Redis from 'ioredis';

const DEFAULT_COOLDOWN_MS = 3000;

let sharedRedis: Redis | null = null;
function getRedisClient(): Redis | null {
  const url = process.env.REDIS_URL;
  if (!url) return null;
  if (!sharedRedis) {
    sharedRedis = new Redis(url, {
      maxRetriesPerRequest: 1,
      enableReadyCheck: true,
    });
  }
  return sharedRedis;
}

@Injectable()
export class TapCooldownService {
  constructor(private tapCooldownRepo: TapCooldownRepository) {}

  private memoryLastTap = new Map<string, number>();

  private cooldownBackend(): 'redis' | 'memory' | 'db' {
    const raw = (process.env.TAP_COOLDOWN_BACKEND || '').toLowerCase();
    if (raw === 'db') return 'db';
    if (raw === 'memory') return 'memory';
    if (raw === 'redis') return 'redis';
    return process.env.REDIS_URL ? 'redis' : 'memory';
  }

  private cooldownKey(terminalId: string, cardUid: string): string {
    return `${terminalId}:${cardUid}`;
  }

  /**
   * Returns true if this is a duplicate tap within the cooldown window.
   * Also updates the last-tap timestamp (so repeated spam stays ignored).
   */
  async isDuplicateAndRecordTap(params: {
    terminalId: string;
    cardUid: string;
    cooldownMs?: number;
  }): Promise<{ isDuplicate: boolean; deltaMs?: number; cooldownMs: number }> {
    const cooldownMs = params.cooldownMs ?? DEFAULT_COOLDOWN_MS;
    const nowMs = Date.now();
    const now = new Date(nowMs);

    const backend = this.cooldownBackend();

    if (backend === 'redis') {
      const redis = getRedisClient();
      if (!redis) {
        // Fallback
      } else {
        const key = `tapCooldown:${this.cooldownKey(params.terminalId, params.cardUid)}`;
        const prevStr = await redis.get(key);
        await redis.psetex(key, Math.max(cooldownMs + 1500, 10_000), String(nowMs));

        if (prevStr) {
          const prevMs = parseInt(prevStr, 10);
          const deltaMs = nowMs - prevMs;
          if (deltaMs >= 0 && deltaMs < cooldownMs) {
            return { isDuplicate: true, deltaMs, cooldownMs };
          }
          return { isDuplicate: false, deltaMs, cooldownMs };
        }

        return { isDuplicate: false, cooldownMs };
      }
    }

    if (backend === 'memory') {
      const key = this.cooldownKey(params.terminalId, params.cardUid);
      const prevMs = this.memoryLastTap.get(key);
      this.memoryLastTap.set(key, nowMs);

      // Basic cleanup guard
      if (this.memoryLastTap.size > 100_000) {
        this.memoryLastTap.clear();
      }

      if (prevMs !== undefined) {
        const deltaMs = nowMs - prevMs;
        if (deltaMs >= 0 && deltaMs < cooldownMs) {
          return { isDuplicate: true, deltaMs, cooldownMs };
        }
        return { isDuplicate: false, deltaMs, cooldownMs };
      }

      return { isDuplicate: false, cooldownMs };
    }

    const existing = await this.tapCooldownRepo.findByTerminalAndCard(
      params.terminalId,
      params.cardUid,
    );

    if (existing) {
      const deltaMs = now.getTime() - existing.lastTapAt.getTime();

      await this.tapCooldownRepo.upsertLastTapAt(
        params.terminalId,
        params.cardUid,
        now,
      );

      if (deltaMs >= 0 && deltaMs < cooldownMs) {
        return { isDuplicate: true, deltaMs, cooldownMs };
      }

      return { isDuplicate: false, deltaMs, cooldownMs };
    }

    await this.tapCooldownRepo.upsertLastTapAt(
      params.terminalId,
      params.cardUid,
      now,
    );

    return { isDuplicate: false, cooldownMs };
  }
}
